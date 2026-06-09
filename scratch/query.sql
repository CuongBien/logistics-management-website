SELECT DISTINCT "OperatorId", count(*) FROM "OperatorActivityLogs" GROUP BY "OperatorId" ORDER BY count(*) DESC LIMIT 20;
