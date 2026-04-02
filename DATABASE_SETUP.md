# ERP System - SQL Server Setup Guide

## Prerequisites

- SQL Server 2019 or higher
- SQL Server Management Studio (SSMS)
- Network access to DESKTOP-ASUHSNB

## Connection Details

```
Server Name: DESKTOP-ASUHSNB
Authentication: SQL Authentication
Login: WebAdmin
Password: ela999438S!
Database: ERPSolution
```

## Step-by-Step Setup

### 1. Connect to SQL Server

Open **SQL Server Management Studio** and connect using above credentials.

### 2. Create Database

```sql
-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ERPSolution')
BEGIN
    CREATE DATABASE [ERPSolution]
    CONTAINMENT = NONE
    ON PRIMARY (
        NAME = N'ERPSolution',
        FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\ERPSolution.mdf',
        SIZE = 100MB,
        FILEGROWTH = 10MB
    )
    LOG ON (
        NAME = N'ERPSolution_log',
        FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\ERPSolution_log.ldf',
        SIZE = 50MB,
        FILEGROWTH = 10MB
    )
END
GO

USE [ERPSolution]
GO
```

### 3. Run Schema Migration

```sql
-- Copy entire content from: database/migrations/001_create_schema.sql
-- Paste and execute in SSMS
```

### 4. Seed Sample Data (Optional)

```sql
-- Copy entire content from: database/seeds/001_seed_data.sql
-- Paste and execute in SSMS
```

### 5. Verify Tables

```sql
-- Check if tables were created
USE [ERPSolution]
GO

-- List all tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Verify row counts
SELECT 'Users' as TableName, COUNT(*) as RowCount FROM dbo.Users
UNION ALL
SELECT 'Accounts', COUNT(*) FROM dbo.Accounts
UNION ALL
SELECT 'Items', COUNT(*) FROM dbo.Items
UNION ALL
SELECT 'Customers', COUNT(*) FROM dbo.Customers
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM dbo.Suppliers;
```

## Database Maintenance

### Backup Database

```sql
-- Full backup
BACKUP DATABASE [ERPSolution]
TO DISK = N'C:\Backup\ERPSolution_Full.bak'
WITH INIT, NAME = N'ERPSolution Full Backup'
GO

-- Transaction log backup
BACKUP LOG [ERPSolution]
TO DISK = N'C:\Backup\ERPSolution_Log.trn'
WITH INIT, NAME = N'ERPSolution Log Backup'
GO
```

### Restore Database

```sql
-- Restore from full backup
RESTORE DATABASE [ERPSolution]
FROM DISK = N'C:\Backup\ERPSolution_Full.bak'
WITH REPLACE
GO
```

### Check Database Integrity

```sql
DBCC CHECKDB ([ERPSolution]);
GO
```

### Update Statistics

```sql
USE [ERPSolution]
GO

EXEC sp_MSForEachTable 'UPDATE STATISTICS ? WITH FULLSCAN'
GO
```

## User Permissions

### Create Application User (Optional)

```sql
USE [ERPSolution]
GO

-- Create login if doesn't exist
IF NOT EXISTS (SELECT * FROM sys.syslogins WHERE name = 'AppUser')
BEGIN
    CREATE LOGIN [AppUser] WITH PASSWORD = N'StrongPassword123!'
END
GO

-- Create database user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'AppUser')
BEGIN
    CREATE USER [AppUser] FOR LOGIN [AppUser]
END
GO

-- Grant permissions
ALTER ROLE [db_datareader] ADD MEMBER [AppUser]
ALTER ROLE [db_datawriter] ADD MEMBER [AppUser]
ALTER ROLE [db_ddladmin] ADD MEMBER [AppUser]
GO
```

## Monitoring Queries

### Check Database Size

```sql
EXEC sp_spaceused;
GO
```

### View Active Connections

```sql
SELECT 
    session_id,
    login_name,
    database_name = DB_NAME(database_id),
    status,
    cpu_time,
    memory_usage
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('ERPSolution')
GO
```

### Check Long-Running Queries

```sql
SELECT 
    session_id,
    login_name,
    status,
    command,
    cpu_time,
    total_elapsed_time / 1000 AS elapsed_seconds,
    reads,
    writes
FROM sys.dm_exec_requests
WHERE database_id = DB_ID('ERPSolution')
GO
```

## Indices

### View Existing Indices

```sql
USE [ERPSolution]
GO

SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
WHERE i.object_id > 0
ORDER BY OBJECT_NAME(i.object_id), i.name;
GO
```

### Rebuild Fragmented Indices

```sql
USE [ERPSolution]
GO

-- Rebuild all indices
EXEC sp_MSForEachTable 'ALTER INDEX ALL ON ? REBUILD'
GO
```

## Troubleshooting

### Connection Issues

```sql
-- Check SQL Server configuration
EXEC xp_readsoftwareregistry 'HKEY_LOCAL_MACHINE', 
'SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.MSSQLSERVER\SuperSocketNetLib\Tcp'
GO
```

### Database Locks

```sql
-- Kill blocking sessions
KILL <session_id>
GO
```

### Reset Auto-Increment

```sql
-- Reset identity
DBCC CHECKIDENT ('dbo.TableName', RESEED, 0)
GO
```

## SQL Server Configuration

### Enable TCP/IP Protocol

1. Open **SQL Server Configuration Manager**
2. Navigate to: SQL Server Network Configuration → Protocols for MSSQLSERVER
3. Set **TCP/IP** to **Enabled**
4. Restart SQL Server service

### Default Port

- Standard SQL Server Port: **1433**
- Configured in connection string as: `DB_PORT=1433`

## Security Best Practices

1. **Use Strong Passwords**
   - WebAdmin account: ela999438S! ✓

2. **Enable SQL Server Authentication**
   - Not just Windows Authentication

3. **Regular Backups**
   - Daily full backups
   - Hourly transaction log backups

4. **Encryption**
   - Enable TDE (Transparent Data Encryption)
   - Use SSL/TLS for connections

5. **Minimize Permissions**
   - Grant least-required permissions
   - Separate read/write accounts

## Performance Tuning

### Query Optimization

```sql
-- Enable execution plans
SET STATISTICS IO ON
SET STATISTICS TIME ON

-- Your query here

SET STATISTICS IO OFF
SET STATISTICS TIME OFF
GO
```

### Review Slow Queries

```sql
-- Queries with highest total time
SELECT TOP 10
    execution_count,
    total_elapsed_time / 1000000 AS TotalSeconds,
    total_elapsed_time / 1000000 / execution_count AS AvgSeconds,
    TEXT
FROM sys.dm_exec_query_stats
CROSS APPLY sys.dm_exec_sql_text(sql_handle)
ORDER BY total_elapsed_time DESC;
GO
```

---

For more information, refer to [Microsoft SQL Server Documentation](https://docs.microsoft.com/en-us/sql/).
