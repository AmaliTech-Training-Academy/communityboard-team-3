"""
Idempotent seed data script for CommunityBoard.

Generates realistic neighborhood community content:
- 30 users (IDs 100-129)
- 80 posts across 4 categories (IDs 100-179)
- 330 comments distributed across posts (IDs 100-429)

Uses OVERRIDING SYSTEM VALUE for GENERATED ALWAYS AS IDENTITY columns.
Idempotent via ON CONFLICT (id) DO NOTHING.
"""
import random
from datetime import datetime, timedelta

from sqlalchemy import text

from db import get_engine, setup_logging, ensure_schema

logger = setup_logging(__name__)

# Fixed seed for reproducible date/assignment spread
random.seed(42)

# BCrypt hash for "password123" — same hash used by backend data.sql
BCRYPT_PASSWORD = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

# ---------------------------------------------------------------------------
# Content: Users (30 users, IDs 100-129)
# ---------------------------------------------------------------------------
SEED_USERS = [
    {"id": 100, "name": "Maria Chen", "email": "maria.chen@example.com"},
    {"id": 101, "name": "David Osei", "email": "david.osei@example.com"},
    {"id": 102, "name": "Fatima Al-Rashid", "email": "fatima.alrashid@example.com"},
    {"id": 103, "name": "James Mensah", "email": "james.mensah@example.com"},
    {"id": 104, "name": "Sarah Johnson", "email": "sarah.johnson@example.com"},
    {"id": 105, "name": "Kwame Asante", "email": "kwame.asante@example.com"},
    {"id": 106, "name": "Emily Park", "email": "emily.park@example.com"},
    {"id": 107, "name": "Michael Owusu", "email": "michael.owusu@example.com"},
    {"id": 108, "name": "Priya Sharma", "email": "priya.sharma@example.com"},
    {"id": 109, "name": "Carlos Rivera", "email": "carlos.rivera@example.com"},
    {"id": 110, "name": "Ama Boateng", "email": "ama.boateng@example.com"},
    {"id": 111, "name": "Tom Nguyen", "email": "tom.nguyen@example.com"},
    {"id": 112, "name": "Grace Adjei", "email": "grace.adjei@example.com"},
    {"id": 113, "name": "Robert Kim", "email": "robert.kim@example.com"},
    {"id": 114, "name": "Nadia Bello", "email": "nadia.bello@example.com"},
    {"id": 115, "name": "Liam O'Brien", "email": "liam.obrien@example.com"},
    {"id": 116, "name": "Aisha Diallo", "email": "aisha.diallo@example.com"},
    {"id": 117, "name": "Daniel Kofi", "email": "daniel.kofi@example.com"},
    {"id": 118, "name": "Sophie Martin", "email": "sophie.martin@example.com"},
    {"id": 119, "name": "Raj Patel", "email": "raj.patel@example.com"},
    {"id": 120, "name": "Hannah Lee", "email": "hannah.lee@example.com"},
    {"id": 121, "name": "Emmanuel Adu", "email": "emmanuel.adu@example.com"},
    {"id": 122, "name": "Lisa Thompson", "email": "lisa.thompson@example.com"},
    {"id": 123, "name": "Ahmed Hassan", "email": "ahmed.hassan@example.com"},
    {"id": 124, "name": "Rachel Green", "email": "rachel.green@example.com"},
    {"id": 125, "name": "Yuki Tanaka", "email": "yuki.tanaka@example.com"},
    {"id": 126, "name": "Peter Addo", "email": "peter.addo@example.com"},
    {"id": 127, "name": "Olivia Brown", "email": "olivia.brown@example.com"},
    {"id": 128, "name": "Samuel Tetteh", "email": "samuel.tetteh@example.com"},
    {"id": 129, "name": "Diana Reyes", "email": "diana.reyes@example.com"},
]

# ---------------------------------------------------------------------------
# Content: Posts — 20 per category = 80 total (IDs 100-179)
# Category IDs: News=1, Events=2, Discussion=3, Alerts=4
# ---------------------------------------------------------------------------

NEWS_POSTS = [
    ("Welcome to Our Neighborhood Board!", "Hi everyone! I'm so glad we finally have a digital space to connect. I've lived on Maple Street for about 5 years now and I still don't know half my neighbors. Let's use this board to change that! Feel free to introduce yourself — where you live, how long you've been here, and what you love about the neighborhood."),
    ("New Family on Elm Street - Hello!", "Hey neighbors! We just moved into 248 Elm Street last weekend. My name is David, and I'm here with my wife and our two kids (ages 6 and 9). We moved from downtown and are loving the quieter streets already. Any tips for new residents? Best pizza spot? Where do the kids play? Looking forward to meeting everyone!"),
    ("Street Light Out on Oak Avenue", "Has anyone else noticed the street light on the corner of Oak Avenue and 3rd Street has been out for about two weeks now? I called the city maintenance line but got put on hold forever. If a few of us report it, they might prioritize the fix. The online form is at the city website under 'Report an Issue.' Stay safe walking at night, everyone."),
    ("Reminder: Trash Collection Schedule Change", "Just a heads up — the city announced that starting next Monday, trash collection for our area moves from Wednesday to Thursday. Recycling stays on the same day (every other Friday). I almost missed this and had my bins out on the wrong day. Thought I'd share so nobody else gets caught off guard!"),
    ("Beautiful Sunset from the Park Yesterday", "I was walking through Riverside Park around 6:30 PM yesterday and caught the most incredible sunset. The sky was all oranges and pinks reflected on the water. Moments like these remind me why I love living here. If you haven't taken an evening stroll through the park recently, I highly recommend it."),
    ("Neighborhood Watch Update - March", "Hi everyone, this is your monthly neighborhood watch update. We had three reports of package theft from porches this month, all on weekday afternoons between 1-4 PM. Please consider using lockboxes or having packages delivered to a neighbor who's home. We're also looking for volunteers to join the patrol schedule."),
    ("Local Business Spotlight: Corner Bakery", "I just wanted to give a shoutout to the Corner Bakery on Pine Street. They've been open for about six months now and their sourdough is honestly the best I've had. They also started doing weekend brunch and the avocado toast is phenomenal. Let's support our local businesses!"),
    ("Dog Owners - Please Pick Up After Your Pets", "I hate to be that person, but I've noticed a significant increase in dog waste left on the sidewalks along Birch Lane, especially near the elementary school. The city provides free bag dispensers at the park entrances. Let's keep our neighborhood clean for the kids walking to school."),
    ("Water Main Work Starting Next Week", "Got a notice from the city that they'll be doing water main replacement work on Cedar Street starting Monday. They said to expect intermittent water outages between 9 AM and 3 PM for about two weeks. Might want to fill up some jugs beforehand."),
    ("Thanks for the Amazing Community Potluck!", "What a wonderful turnout at yesterday's potluck in the park! I counted at least 60 people and the food was incredible. Special thanks to whoever brought the jollof rice — I need that recipe! And the kids had a blast with the face painting. Let's make this a monthly tradition."),
    ("Petition to Add Speed Bumps on Cherry Lane", "I've been working on a petition to add speed bumps on Cherry Lane between 1st and 5th Street. Cars regularly exceed 40mph in a 25mph zone, and with the new playground opening, it's becoming a real safety concern. I need 200 signatures to present to the city council."),
    ("Free Little Library is Up!", "Excited to announce that the Free Little Library box is officially installed in front of 322 Maple Street! Take a book, leave a book — it's that simple. I've stocked it with a mix of fiction, non-fiction, and kids' books to get started."),
    ("Noise from Construction Site - Anyone Else Affected?", "The construction on the new apartment complex on River Road has been starting at 6 AM sharp every day this week. I checked the city ordinance and construction noise isn't allowed before 7 AM in residential areas. Has anyone else been bothered by this?"),
    ("Community Center Renovations Complete", "Great news — the community center renovations are finally done! The new gym floor looks amazing, the meeting rooms have been updated, and they added a small kitchen area. The grand reopening is this Saturday at 10 AM with free refreshments."),
    ("New Crosswalk Installed on Main Street", "The city finally installed the crosswalk we petitioned for on Main Street near the elementary school. It has flashing lights and everything. This has been two years in the making. Thank you to everyone who signed the petition and showed up to the council meetings!"),
    ("Library Extends Saturday Hours", "The Pine Street Library is now open until 6 PM on Saturdays instead of closing at 2 PM. They also added more public computers and a dedicated quiet study room. Perfect timing for students. Great to see our local library growing."),
    ("Local Business Association Formed", "A group of local business owners met last week and formally created the Riverside Business Association. Their goal is to coordinate events, share resources, and advocate for small businesses in our area. The Corner Bakery, the hardware store, and 8 other shops are founding members."),
    ("Recycling Program Expansion Announced", "Starting next month, the city is expanding curbside recycling to include glass and electronics. They'll also be placing new sorted bins at Riverside Park and near the community center. This is a big step forward. Detailed guidelines will be posted on the city website."),
    ("Community Board Reaches 500 Members!", "We just hit 500 registered members on the neighborhood board! When we started this a year ago, we weren't sure anyone would use it. Now it's become the go-to place for neighborhood news. Thank you all for making this community so vibrant and connected."),
    ("Annual Budget Meeting Summary", "For those who missed last night's city budget meeting, here are the highlights for our neighborhood: $50K allocated for sidewalk repairs on Elm Street, $30K for new park playground equipment, and $15K for additional street lighting. Full minutes are on the city website."),
]

EVENTS_POSTS = [
    ("Annual Block Party - Save the Date!", "Mark your calendars! Our annual block party is happening on Saturday, April 15th from 2-8 PM on Maple Street (between Oak and Elm). We'll have a BBQ, live music from a local band, a bouncy castle for the kids, and a pie-baking contest. If you'd like to volunteer or bring a dish, sign up below!"),
    ("Community Garden Spring Planting Day", "Spring is here and it's time to get our hands dirty! Join us this Saturday at 9 AM at the community garden on Birch Lane for our annual spring planting day. We have plots available for new gardeners and plenty of seeds to share. Coffee and snacks provided!"),
    ("Free Yoga in the Park Every Sunday", "Starting this Sunday and running through the end of summer, I'll be leading free yoga sessions at Riverside Park at 8 AM. All levels welcome — from complete beginners to experienced practitioners. Just bring a mat or large towel and water."),
    ("Neighborhood Cleanup Day - Volunteers Needed", "Let's show some love to our neighborhood! We're organizing a community cleanup day for next Saturday, March 25th. Meet at the community center at 9 AM. Gloves, bags, and grabbers will be provided. Pizza lunch for all volunteers! Kids welcome with parent supervision."),
    ("Movie Night at the Park - This Friday!", "Outdoor movie night is back! This Friday at sundown (approximately 7:30 PM) at Riverside Park. We're showing a family-friendly film on the big inflatable screen. Bring blankets, lawn chairs, and snacks. The popcorn machine will be running. Free for all residents."),
    ("Local Artist Exhibition at Community Center", "The community center will host an exhibition featuring artwork from 12 local artists. Opening night is Thursday, April 3rd from 6-9 PM with wine and cheese. The exhibition runs through April 20th during regular center hours."),
    ("Kids' Soccer League Registration Open", "Registration is now open for the spring kids' soccer league! Ages 5-12, games on Saturday mornings at the Riverside fields. Season runs April through June. Cost is $30 per child (scholarships available). No experience needed — we focus on fun and learning."),
    ("Farmers Market Returns Next Weekend", "Great news — the neighborhood farmers market is returning for the season! Starting next Saturday, 8 AM to 1 PM in the community center parking lot. Expect fresh produce, baked goods, honey, artisan crafts, and live acoustic music."),
    ("Emergency Preparedness Workshop", "The fire department is hosting a free emergency preparedness workshop at the community center on April 10th from 6-8 PM. They'll cover earthquake readiness, fire safety, first aid basics, and how to create a family emergency plan. Free emergency kits for the first 50 attendees."),
    ("Garage Sale Weekend - Map Your House!", "Our neighborhood-wide garage sale weekend is set for April 22-23! If you want your house on the official map, please comment below with your address by April 15th. Last year we had 35 participating houses and hundreds of shoppers."),
    ("Book Club Meetup - First Tuesday Monthly", "Our neighborhood book club meets the first Tuesday of every month at 7 PM at the Corner Bakery on Pine Street. New members always welcome — you don't even have to finish the book to join the discussion! Come for the books, stay for the pastries."),
    ("Senior Social - Tea and Board Games", "Calling all seniors! We're starting a weekly social hour every Wednesday from 2-4 PM at the community center. Tea, coffee, and light snacks provided. Bring your favorite board games or card games, or just come for conversation."),
    ("5K Fun Run for Charity - Sign Up Now", "Join us for the 3rd annual neighborhood 5K fun run on May 5th! All proceeds go to the local food bank. Registration is $20 for adults, $10 for kids under 12. Walk, jog, or run — it's all about community spirit. Post-race celebration with food trucks!"),
    ("Photography Walk Through the Neighborhood", "Grab your cameras! I'm organizing a neighborhood photography walk this Sunday at 10 AM, starting from Riverside Park. We'll explore the hidden gems and beautiful corners of our community. All skill levels and phone photographers welcome. We'll share our best shots on the board afterward."),
    ("Community Talent Show Next Month", "We're hosting a neighborhood talent show at the community center on May 15th at 7 PM! Singers, dancers, comedians, magicians — all acts welcome. Sign up by May 1st. Audience admission is free. Let's discover the hidden talents in our neighborhood!"),
    ("Neighborhood Trivia Night at the Pub", "The Riverside Pub is hosting a neighborhood trivia night this Thursday at 7:30 PM. Teams of 2-6 players. Categories include local history, pop culture, sports, and science. The winning team gets a $50 gift card. No entry fee — just buy your drinks. Let's send this!"),
    ("Free Computer Classes for Seniors", "The library is offering free computer literacy classes every Monday and Wednesday from 10 AM to noon. Topics include email basics, internet safety, video calling with family, and online shopping. Bring your own device or use the library computers. Registration at the front desk."),
    ("Spring Flea Market at Community Center", "The spring flea market is happening March 30th from 9 AM to 3 PM at the community center. Table reservations are $15 and going fast. Great opportunity to sell crafts, vintage items, or just declutter. Shoppers welcome — no entry fee!"),
    ("Earth Day Tree Planting Event", "Celebrate Earth Day with us! On April 22nd at 9 AM, we're planting 50 new trees along the creek trail at Riverside Park. The city is providing the trees and tools. Bring gloves and water. Kids get a free sapling to take home and plant in their yard."),
    ("Summer Reading Program Kickoff at Library", "The Pine Street Library's summer reading program starts June 1st. Kids, teens, and adults can all participate. Read books, earn points, and win prizes including gift cards, books, and a grand prize bike. Registration opens May 15th online or at the library."),
]

DISCUSSION_POSTS = [
    ("Best Pizza Spot in the Neighborhood?", "My family just moved here and we're on a mission to find the best pizza within walking distance. We've tried Sal's on Oak Avenue (decent but pricey) and the new place on Cedar Street (great crust but limited toppings). What's your go-to? Bonus points if they deliver!"),
    ("Should We Start a Tool Library?", "I was thinking — how many of us own a pressure washer we use twice a year? Or a tile saw that's been collecting dust? What if we started a neighborhood tool library where residents could borrow items? Other communities have done this with great success."),
    ("Working From Home — Best Cafe Spots?", "I've been working remotely for two years and my home office walls are closing in. Looking for good cafes nearby with reliable Wi-Fi, decent coffee, and a vibe that's okay with someone camping out for a few hours. Where do you remote workers hang out?"),
    ("Thoughts on the New Bike Lane Proposal?", "The city council is proposing a protected bike lane on River Road, which would remove parking on one side. As someone who both drives and cycles, I see pros and cons. What does everyone think? The public comment period ends next Friday."),
    ("How Do You Handle Package Deliveries?", "With the uptick in porch piracy, I'm curious what solutions neighbors are using. I've been considering a lockbox, having everything sent to a locker, or just timing deliveries for when I'm home. What's worked for you?"),
    ("Local Schools — Your Experience?", "We're moving to the area with two kids (ages 7 and 10) and trying to decide between the local elementary schools. The ratings online seem mixed. Would love to hear from parents with firsthand experience. How are the teachers?"),
    ("Is Anyone Else Concerned About Traffic on Elm?", "Ever since the detour started on Highway 9, Elm Street has become a cut-through for commuters. We're seeing speeds well over 35mph in a residential zone. My kids walk to school along that route. Has anyone approached the city about temporary speed mitigation?"),
    ("Favorite Walking Routes in the Neighborhood", "I'm trying to get my 10,000 steps in daily and want to explore beyond my usual loop around Riverside Park. What are your favorite walking routes? I'm looking for scenic paths, interesting streets with nice gardens, or routes that pass by good coffee shops."),
    ("Recommendations for a Good Handyman?", "I've got a list of small house projects — a leaky faucet, a door that won't close properly, some drywall patches, and a wobbly deck railing. Does anyone know a reliable handyman who handles this kind of mixed bag? Reasonable rates and someone who actually shows up."),
    ("Starting a Neighborhood Compost Program", "I've been composting at home for years and I know several neighbors are interested too. Would there be support for a shared neighborhood compost bin at the community garden? We could take turns managing it and everyone gets to use the finished compost."),
    ("Best Internet Provider in This Area?", "Our current internet has been unreliable for months — random outages, slow speeds during peak hours, and terrible customer service. We're ready to switch. What provider are you on and how's your experience? Fiber would be ideal if it's available here."),
    ("Dog-Friendly Places Nearby?", "We just adopted a rescue dog and we're discovering which places welcome pups. So far we know Riverside Park and the Corner Bakery patio. Are there other dog-friendly restaurants, shops, or trails? Also, is there an off-leash area nearby?"),
    ("Solar Panels — Worth the Investment?", "I've been getting quotes for solar panel installation and the numbers look promising with the current tax credits. But I've heard mixed things about the actual savings. Any neighbors who've gone solar willing to share their real experience?"),
    ("Electric Vehicle Charging — Where to Charge?", "I'm considering an EV but the nearest public charging station seems pretty far. Has anyone looked into installing a home charger? What did it cost? And are there any plans for public chargers in the neighborhood? Would love to go electric but need the infrastructure."),
    ("Best Vet in the Area?", "Our cat needs a new vet — our old one retired. Looking for someone who's good with anxious cats, reasonably priced, and doesn't push unnecessary treatments. Bonus if they're within a short drive. Who do you take your pets to?"),
    ("How to Get Involved in Local Politics?", "I've been complaining about things not changing in our neighborhood and realized I should be part of the solution. How do you get started with local government? Council meetings? Volunteering? Running for a committee? Would love advice from anyone who's been involved."),
    ("Thoughts on the New Parking Meters?", "The city just installed parking meters along Main Street. I get that they need revenue, but it's already hard enough to find parking for the local shops. Has anyone noticed fewer customers at the businesses since? Seems like it could hurt the small shops we're trying to support."),
    ("Anyone Growing Fruit Trees Successfully?", "I planted an apple tree and a fig tree last year but they're not looking great. The leaves are yellowing and the apple tree barely produced anything. Is there something about the soil or climate here I should know? Any experienced gardeners have tips for fruit trees specifically?"),
    ("Recommendations for Home Security Systems?", "After the recent break-in reports on Birch Lane, we want to upgrade our home security. What systems are neighbors using? Looking for something with cameras, door sensors, and smartphone alerts. DIY vs. professional installation? What's the monthly cost like?"),
    ("Best Strategies for Home Energy Savings?", "Our heating bill this winter was outrageous. We've got an older home (1970s) and I suspect the insulation is terrible. Before we invest in major upgrades, what quick wins have worked for you? Weatherstripping? Smart thermostats? Any local contractors you'd recommend for energy audits?"),
]

ALERTS_POSTS = [
    ("Lost Cat - Gray Tabby Named Whiskers", "Our gray tabby cat Whiskers has been missing since Tuesday evening. He's about 4 years old, neutered, wearing a blue collar with a bell. Last seen near the corner of Oak Avenue and 5th Street. If you spot him, please call or text me — contact info is on his collar tag. We miss him terribly."),
    ("ALERT: Package Thefts on Birch Lane", "Three packages were stolen from porches on Birch Lane this week, all between 1-4 PM on weekday afternoons. One neighbor's doorbell camera caught a person in a gray hoodie driving a white sedan. If you live in the area, please bring packages inside quickly or arrange alternate delivery."),
    ("Water Main Break on Cedar Street — Avoid Area", "Heads up — there's a major water main break on Cedar Street between 3rd and 5th. The road is flooded and closed to traffic. City crews are on scene. Expect water pressure issues in the surrounding blocks. They estimate repairs will take 6-8 hours."),
    ("Coyote Spotted Near Riverside Park", "I saw a coyote near the south entrance of Riverside Park around 6 AM this morning. It was near the creek area and didn't seem afraid of people. If you walk dogs early morning or evening, please keep them on a leash and stay in well-lit areas."),
    ("Suspicious Door-to-Door Solicitors", "Two people have been going door to door on Elm Street claiming to be from the utility company and asking to inspect meters inside homes. The utility company confirmed they have NO inspectors in our area this week. Do NOT let anyone inside your home."),
    ("Road Closure: Oak Avenue This Weekend", "Oak Avenue between Main and 6th Street will be completely closed this Saturday and Sunday for repaving. Detour signs will be posted but plan alternate routes. Also, no parking on Oak starting Friday at 10 PM — cars will be towed."),
    ("Power Outage Expected Thursday", "The electric company sent notice that there will be a planned power outage Thursday from 9 AM to 2 PM for the blocks around Pine Street and Maple Avenue. They're upgrading transformer equipment. Make sure to charge devices and plan accordingly."),
    ("Found Dog - Brown Labrador, No Collar", "Found a friendly brown Labrador mix wandering on Cherry Lane around 7 PM tonight. No collar, no tags, but very well-behaved — clearly someone's pet. We've brought him inside and he's safe and fed. If this is your dog, please reach out with a description."),
    ("Tree Down Blocking Walnut Street", "A large tree fell across Walnut Street near the park entrance during last night's storm. It's completely blocking both lanes and took down a power line. DO NOT approach — the downed line may be live. I've called both the city and the power company."),
    ("Noise Alert: Construction Starting 6 AM Daily", "The new apartment complex construction on River Road is starting early morning work. I've confirmed with the city that their permit allows 7 AM starts, but they've been beginning at 6 AM. I'm filing a noise complaint and encourage affected neighbors to do the same."),
    ("Flash Flood Warning for Low-Lying Areas", "The weather service has issued a flash flood warning for our area through tomorrow morning. If you live near the creek or in the low-lying blocks around River Road, please move valuables to upper floors and be prepared to evacuate if needed. Sandbags are available at the fire station."),
    ("Missing Elderly Resident - Please Help", "Mr. Harold Peterson, age 78, has been missing from his home on Birch Lane since this morning. He has dementia and may be confused. He's about 5'10\", thin build, wearing a blue jacket and khaki pants. If you see him, please stay with him and call 911 immediately."),
    ("Boil Water Advisory Lifted — Update", "Good news — the boil water advisory for our neighborhood has been lifted as of this afternoon. Water testing results came back clean. You can resume normal water use. Run your cold water taps for about 2 minutes to flush the lines first."),
    ("Gas Smell Reported on Pine Street", "Several residents on Pine Street between 2nd and 4th have reported a strong gas smell this evening. The gas company has been called and they recommend opening windows and avoiding using any open flames or electrical switches until they arrive. If the smell is very strong, evacuate calmly."),
    ("Abandoned Vehicle on Cherry Lane", "There's been an abandoned vehicle parked on Cherry Lane near the community garden for over two weeks now. It has flat tires and no plates. I've reported it to parking enforcement. If it belongs to someone you know, please have them move it before it gets towed."),
    ("Severe Weather Warning Tomorrow", "The national weather service issued a severe thunderstorm warning for our area tomorrow afternoon through evening. Expect high winds, heavy rain, and possible hail. Secure outdoor furniture, bring in pets, and avoid unnecessary travel from 3-9 PM. Stay safe, neighbors."),
    ("Stray Dog Pack Near Creek Area", "I've seen a group of 3-4 stray dogs near the creek trail at Riverside Park for the past few days. They seem skittish but could be unpredictable. Please be cautious if walking in that area, especially with children or small dogs. I've reported it to animal control."),
    ("Fire Hydrant Broken on Maple Street", "The fire hydrant at the corner of Maple and 4th has been leaking heavily since yesterday. Water is running down the street and has started icing over in the cold spots. I called the water department but wanted to alert everyone. Drive carefully on that block."),
    ("Internet Outage Affecting Several Blocks", "Is anyone else's internet out? It seems like the entire area around Elm and Birch has been offline since about 3 PM. The provider's outage map confirms a local outage. They estimate restoration by 8 PM tonight. Heading to the Corner Bakery to use their Wi-Fi for now."),
    ("Recall: Local Grocery Store Product", "The Oak Avenue Market posted a recall notice for their house-brand peanut butter (all sizes, lot numbers 2024-A through 2024-F) due to potential contamination. If you purchased any, return it for a full refund. Don't consume it — check your pantry today."),
]

# ---------------------------------------------------------------------------
# Content: Comment templates (35 templates, reused across posts)
# ---------------------------------------------------------------------------
COMMENT_TEMPLATES = [
    "Totally agree with this! We've had the same experience in our house.",
    "Thanks for sharing this — really helpful information!",
    "This is exactly what I needed to hear. Count me in!",
    "Great post! I've been thinking about this too.",
    "+1 on this. It's been an issue for a while now.",
    "Thank you so much for organizing this! Our family will be there.",
    "Love this idea! The neighborhood really needs more initiatives like this.",
    "Interesting! Do you know if this applies to apartments too, or just houses?",
    "What time exactly should we show up? And is parking available nearby?",
    "Great recommendation! How much did it end up costing you in total?",
    "This sounds amazing. Are there any age restrictions for participants?",
    "How long did the installation take? Thinking about getting one myself.",
    "We had the same problem last year and ended up calling Johnson's Plumbing on Oak Street. They were great and very fair on price.",
    "I saw them working on the lines yesterday too! Really hoping we get fiber soon, our current internet is terrible for video calls.",
    "My kids attended last year's event and loved it. They're still talking about what they learned!",
    "I've lived here for 20 years and this is one of the best community events we've ever had. Kudos to the organizers!",
    "The farmer's market was wonderful last year. The honey from the local apiary was the best I've ever tasted.",
    "Happy to help out! I have a truck if you need anything transported.",
    "I can volunteer for the Saturday morning shift. Just let me know the details!",
    "I'm a retired teacher and would love to help with the tutoring. DM me!",
    "We have extra garden tools if anyone needs to borrow some for the planting day.",
    "I can bring homemade lemonade and cookies for the event!",
    "Pro tip: if you call the city's non-emergency line instead of the main number, you get through much faster.",
    "You might want to check if there's a permit required first. I learned that the hard way last year.",
    "For anyone concerned about cost, the library has free passes to some of these programs.",
    "I'd recommend getting at least three quotes before choosing a contractor. Prices vary wildly in this area.",
    "Make sure to take lots of photos BEFORE starting any work. It's crucial for insurance claims.",
    "You're a lifesaver! Thank you so much for sharing this.",
    "What an amazing community we have. Thanks for looking out for each other!",
    "Really appreciate you taking the time to share this with everyone.",
    "This is why I love this neighborhood. People actually care about each other here.",
    "Thanks for the heads up! I would have totally missed this otherwise.",
    "I'm a bit worried about the timing. Could we consider a different date perhaps?",
    "Has anyone verified this with the city? I heard a different date from the council member.",
    "Good point, but I think we also need to address the root cause, not just the symptoms.",
]

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _random_date(days_back_min, days_back_max):
    """Return a random datetime between days_back_max and days_back_min days ago."""
    days = random.randint(days_back_min, days_back_max)
    hours = random.randint(6, 22)
    minutes = random.randint(0, 59)
    return datetime.now() - timedelta(days=days, hours=hours, minutes=minutes)


def _build_posts():
    """Combine all category posts into a flat list with IDs and category_id assigned."""
    all_posts = []
    categories = [
        (1, NEWS_POSTS),
        (2, EVENTS_POSTS),
        (3, DISCUSSION_POSTS),
        (4, ALERTS_POSTS),
    ]
    post_id = 100
    user_ids = [u["id"] for u in SEED_USERS]

    for category_id, posts in categories:
        for title, content in posts:
            all_posts.append({
                "id": post_id,
                "title": title,
                "content": content,
                "category_id": category_id,
                "author_id": random.choice(user_ids),
                "created_at": _random_date(1, 30),
                "is_deleted": False,
            })
            post_id += 1

    return all_posts


def _build_comments(posts):
    """Generate 330 comments distributed across posts."""
    comments = []
    comment_id = 100
    user_ids = [u["id"] for u in SEED_USERS]
    num_templates = len(COMMENT_TEMPLATES)

    # Sort posts by ID, assign popularity: first 10 popular, next 30 medium, rest quiet
    sorted_posts = sorted(posts, key=lambda p: p["id"])

    for i, post in enumerate(sorted_posts):
        if i < 10:
            count = random.randint(8, 12)     # popular posts
        elif i < 40:
            count = random.randint(3, 6)      # medium posts
        else:
            count = random.randint(1, 3)      # quieter posts

        post_author = post["author_id"]
        post_created = post["created_at"]

        for j in range(count):
            # Pick a comment template (cycle through all of them)
            template_idx = (comment_id - 100) % num_templates
            # Pick an author different from the post author
            author_id = random.choice([uid for uid in user_ids if uid != post_author])
            # Comment timestamp: 1 hour to 7 days after the post
            offset_hours = random.randint(1, 168)
            created_at = post_created + timedelta(hours=offset_hours)
            if created_at > datetime.now():
                created_at = datetime.now() - timedelta(hours=random.randint(1, 24))

            comments.append({
                "id": comment_id,
                "content": COMMENT_TEMPLATES[template_idx],
                "post_id": post["id"],
                "author_id": author_id,
                "created_at": created_at,
                "is_deleted": False,
            })
            comment_id += 1

    return comments


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

SEED_CATEGORIES = [
    {"id": 1, "name": "News", "description": "Community news and announcements"},
    {"id": 2, "name": "Events", "description": "Upcoming community events"},
    {"id": 3, "name": "Discussion", "description": "General discussions and conversations"},
    {"id": 4, "name": "Alerts", "description": "Important alerts and notices"},
]


def seed_categories(conn):
    """Insert 4 categories (IDs 1-4). Idempotent via ON CONFLICT DO NOTHING."""
    logger.info("Seeding categories...")
    for cat in SEED_CATEGORIES:
        conn.execute(text("""
            INSERT INTO categories (id, name, description)
            OVERRIDING SYSTEM VALUE
            VALUES (:id, :name, :description)
            ON CONFLICT (id) DO NOTHING
        """), cat)
    conn.commit()
    result = conn.execute(text("SELECT COUNT(*) FROM categories")).scalar()
    logger.info("Categories seeded: %d", result)


def seed_users(conn):
    """Insert 30 users (IDs 100-129). Idempotent via ON CONFLICT DO NOTHING."""
    logger.info("Seeding users...")
    for user in SEED_USERS:
        conn.execute(text("""
            INSERT INTO users (id, email, name, password, role, is_active, created_at)
            OVERRIDING SYSTEM VALUE
            VALUES (:id, :email, :name, :password, :role, TRUE, :created_at)
            ON CONFLICT (id) DO NOTHING
        """), {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "password": BCRYPT_PASSWORD,
            "role": "USER",
            "created_at": _random_date(10, 45),
        })
    conn.commit()
    result = conn.execute(text("SELECT COUNT(*) FROM users WHERE id >= 100")).scalar()
    logger.info("Users seeded: %d", result)


def seed_posts(conn):
    """Insert 80 posts (IDs 100-179). Idempotent via ON CONFLICT DO NOTHING."""
    logger.info("Seeding posts...")
    posts = _build_posts()
    for post in posts:
        conn.execute(text("""
            INSERT INTO posts (id, title, content, category_id, author_id, created_at, updated_at, is_deleted)
            OVERRIDING SYSTEM VALUE
            VALUES (:id, :title, :content, :category_id, :author_id, :created_at, :created_at, :is_deleted)
            ON CONFLICT (id) DO NOTHING
        """), post)
    conn.commit()
    result = conn.execute(text("SELECT COUNT(*) FROM posts WHERE id >= 100")).scalar()
    logger.info("Posts seeded: %d", result)
    rows = conn.execute(text(
        "SELECT c.name, COUNT(p.id) FROM posts p "
        "JOIN categories c ON p.category_id = c.id "
        "WHERE p.id >= 100 GROUP BY c.name ORDER BY c.name"
    )).fetchall()
    for name, count in rows:
        logger.info("  %s: %d", name, count)
    return posts


def seed_comments(conn, posts):
    """Insert 330 comments (IDs 100+). Idempotent via ON CONFLICT DO NOTHING."""
    logger.info("Seeding comments...")
    comments = _build_comments(posts)
    for comment in comments:
        conn.execute(text("""
            INSERT INTO comments (id, content, post_id, author_id, created_at, is_deleted)
            OVERRIDING SYSTEM VALUE
            VALUES (:id, :content, :post_id, :author_id, :created_at, :is_deleted)
            ON CONFLICT (id) DO NOTHING
        """), comment)
    conn.commit()
    result = conn.execute(text("SELECT COUNT(*) FROM comments WHERE id >= 100")).scalar()
    logger.info("Comments seeded: %d", result)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    logger.info("=" * 60)
    logger.info("CommunityBoard Seed Data")
    logger.info("=" * 60)
    engine = get_engine()
    with engine.connect() as conn:
        ensure_schema(conn, logger)
        seed_categories(conn)
        seed_users(conn)
        posts = seed_posts(conn)
        seed_comments(conn, posts)
    logger.info("=" * 60)
    logger.info("Seeding complete!")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
