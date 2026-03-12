package com.amalitech.communityboard.config.DbConfig;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class AnalyticsDataSourceConfig {

    // Secondary datasource pointing to Ernest's analytics DB
    @Bean(name = "analyticsDataSource")
    public DataSource analyticsDataSource(
            @Value("${analytics.datasource.url}") String url,
            @Value("${analytics.datasource.username}") String username,
            @Value("${analytics.datasource.password}") String password) {

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }

    // JdbcTemplate wired to analytics datasource for raw SQL queries
    @Bean(name = "analyticsJdbcTemplate")
    public JdbcTemplate analyticsJdbcTemplate(
            @Qualifier("analyticsDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
