import streamlit as st
import pandas as pd
import plotly.express as px
from streamlit_autorefresh import st_autorefresh
import db
from etl.kms import decrypt
import datetime

st.set_page_config(page_title="CommunityBoard Analytics Dashboard", layout="wide")

# Auto-refresh every 15 minutes (900000 ms)
st_autorefresh(interval=15 * 60 * 1000, key="data_refresh")

st.title("CommunityBoard Analytics Dashboard")
st.markdown("This interactive dashboard displays live operational insights alongside encrypted analytical tracking.")

@st.cache_data(ttl=900)
def load_data():
    engine = db.get_engine()
    
    # Load raw data for interactive hour/date filtering
    posts_query = """
        SELECT p.id, p.created_at, p.is_deleted, c.name as category_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
    """
    posts_df = pd.read_sql(posts_query, engine)
    
    comments_df = pd.read_sql("SELECT id, created_at, is_deleted FROM comments", engine)
    users_df = pd.read_sql("SELECT id, created_at, is_active FROM users", engine)
    
    # Load Top Contributors from analytics DB for decryption demo
    analytics_engine = db.get_analytics_engine()
    try:
        top_users_df = pd.read_sql("SELECT * FROM analytics_top_contributors ORDER BY contribution_rank LIMIT 5", analytics_engine)
        # Decrypt names
        top_users_df['Real Name'] = top_users_df['encrypted_name'].apply(
            lambda x: decrypt(x) if pd.notnull(x) and x != "" else "Unknown"
        )
    except Exception as e:
        top_users_df = pd.DataFrame()
        st.error(f"Could not load analytics top contributors: {e}")
    
    return posts_df, comments_df, users_df, top_users_df

try:
    with st.spinner('Loading data from database...'):
        posts_df, comments_df, users_df, top_users_df = load_data()
except Exception as e:
    st.error(f"Error loading data from database. Is the DB running? Error: {e}")
    st.stop()

# Convert to datetime if data exists
if not posts_df.empty:
    posts_df['created_at'] = pd.to_datetime(posts_df['created_at'])
if not comments_df.empty:
    comments_df['created_at'] = pd.to_datetime(comments_df['created_at'])
if not users_df.empty:
    users_df['created_at'] = pd.to_datetime(users_df['created_at'])

# --- SIDEBAR FILTERS ---
st.sidebar.header("Interactive Filters")

if not posts_df.empty:
    min_date = posts_df['created_at'].min().date()
    max_date = posts_df['created_at'].max().date()
else:
    min_date = datetime.date.today() - datetime.timedelta(days=7)
    max_date = datetime.date.today()

date_range = st.sidebar.date_input("Select Date Range", [min_date, max_date], min_value=min_date, max_value=max_date)

if isinstance(date_range, tuple) or isinstance(date_range, list):
    if len(date_range) == 2:
        start_date, end_date = date_range
    elif len(date_range) == 1:
        start_date = end_date = date_range[0]
    else:
        start_date = min_date
        end_date = max_date
else:
    start_date = end_date = date_range

start_dt = pd.to_datetime(start_date)
end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1, seconds=-1)

hour_range = st.sidebar.slider("Select Hour of Day Range", 0, 23, (0, 23))

# Category filter
all_categories = sorted(posts_df['category_name'].dropna().unique().tolist()) if not posts_df.empty else []
selected_categories = st.sidebar.multiselect("Filter by Category", options=all_categories, default=all_categories)

# --- APPLY FILTERS ---
def filter_df(df, apply_category=False):
    if df.empty:
        return df
    mask = (df['created_at'] >= start_dt) & (df['created_at'] <= end_dt) & \
           (df['created_at'].dt.hour >= hour_range[0]) & (df['created_at'].dt.hour <= hour_range[1])
    if apply_category and 'category_name' in df.columns and selected_categories:
        mask = mask & (df['category_name'].isin(selected_categories))
    return df[mask]

f_posts = filter_df(posts_df, apply_category=True)
f_comments = filter_df(comments_df)
f_users = filter_df(users_df)

# --- KPIs ---
st.header("Overall Metrics")
col1, col2, col3 = st.columns(3)
col1.metric("Total Posts", len(f_posts))
col2.metric("Total Comments", len(f_comments))
col3.metric("Total Users", len(f_users))

st.markdown("---")

col_charts1, col_charts2 = st.columns(2)

with col_charts1:
    st.subheader("Posts per Category")
    if not f_posts.empty:
        cat_counts = f_posts['category_name'].value_counts().reset_index()
        cat_counts.columns = ['Category', 'Posts']
        fig_cat = px.pie(cat_counts, names='Category', values='Posts', hole=0.4,
                         color_discrete_sequence=px.colors.qualitative.Pastel)
        st.plotly_chart(fig_cat, use_container_width=True)
    else:
        st.info("No posts found for the selected filters.")

with col_charts2:
    st.subheader("Activity Trends (Most Active Days)")
    if not f_posts.empty:
        f_posts['Date'] = f_posts['created_at'].dt.date
        trend = f_posts.groupby('Date').size().reset_index(name='Posts')
        fig_trend = px.line(trend, x='Date', y='Posts', markers=True, 
                            line_shape='spline', color_discrete_sequence=['#ff7f0e'])
        fig_trend.update_layout(xaxis_title="Date", yaxis_title="Number of Posts")
        st.plotly_chart(fig_trend, use_container_width=True)
    else:
        st.info("No timeline data found for the selected filters.")

st.markdown("---")
st.subheader("Posts by Day of Week")
if not f_posts.empty:
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    f_posts['day_of_week'] = pd.Categorical(f_posts['created_at'].dt.day_name(), categories=day_order, ordered=True)
    daily_cat = f_posts.groupby(['day_of_week', 'category_name'], observed=False).size().reset_index(name='Posts')
    fig_daily = px.bar(
        daily_cat, x='day_of_week', y='Posts', color='category_name',
        barmode='group',
        labels={'day_of_week': 'Day of Week', 'category_name': 'Category'},
        color_discrete_sequence=px.colors.qualitative.Set2
    )
    fig_daily.update_layout(xaxis_title="Day of Week", yaxis_title="Number of Posts")
    st.plotly_chart(fig_daily, use_container_width=True)
else:
    st.info("No posts found for the selected filters.")

st.markdown("---")
st.subheader("🏆 Top 5 Contributors")
st.markdown("Showing securely decrypted names from the analytics ETL pipeline's top contributors table. Only the highest ranked contributors across all time are shown.")
if not top_users_df.empty:
    display_top = top_users_df[['contribution_rank', 'Real Name', 'posts_created', 'comments_made', 'total_contributions']]
    display_top.columns = ['Rank', 'Decrypted Name', 'Posts', 'Comments', 'Total Contributions']
    st.dataframe(display_top, use_container_width=True, hide_index=True)
else:
    st.info("No top contributors data found. ETL pipeline may not have run yet.")
