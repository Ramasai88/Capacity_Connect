import { CourseCurriculum } from "./types";

export const courseSql301: CourseCurriculum = {
  "courseId": "course-sql-301",
  "totalDurationMinutes": 900,
  "modules": [
    {
      "id": "sql-mod-1",
      "order": 1,
      "title": "Module 1 — Relational Storage Engines, B-Tree Indexes & Table Scans",
      "durationMinutes": 180,
      "summary": "PostgreSQL page architecture (8KB pages), heap tuples, B-Tree index mechanics ($O(\\log N)$ lookup, node splitting), covering indexes, and sequential scan vs index scan trade-offs.",
      "learningObjectives": [
        "Explain how relational storage engines organize tables into 8KB disk pages and tuple headers.",
        "Analyze the internal structure of B-Tree indexes: root, branch, and leaf nodes.",
        "Construct covering indexes with `INCLUDE` clauses to enable high-speed Index-Only Scans."
      ],
      "resources": [
        {
                "title": "PostgreSQL Official Documentation: Indexes and Table Access Methods",
                "url": "https://www.postgresql.org/docs/current/indexes.html",
                "description": "B-Tree internal structure, BRIN indexing for time-series, GIN for JSONB/full-text, and GiST.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "Use The Index, Luke! A Guide to Database Performance for Developers",
                "url": "https://use-the-index-luke.com/",
                "description": "Comprehensive visual guide on index range scans, composite index order, and avoiding table scans.",
                "type": "guide",
                "provider": "Markus Winand"
        }
],
      "content": {
        "overview": "Understanding how PostgreSQL persists data into disk pages and navigates B-Tree index trees is essential for designing sub-millisecond database queries.",
        "keyConcepts": [
          {
            "section": "Section 1 — Relational Storage Architecture",
            "topic": "Page & Heap Mechanics",
            "title": "Lesson 1 — PostgreSQL Storage Architecture: 8KB Pages & Heap Tuples",
            "prerequisites": "Basic SQL queries (SELECT, INSERT).",
            "description": "PostgreSQL stores table data in fixed-size 8KB disk pages. Each page contains a page header, item pointer array, free space, and raw row tuples.",
            "whyItMatters": "Understanding page layout explains why table bloat occurs and how disk I/O dictates query execution time.",
            "howItWorks": "When a query executes, the engine reads 8KB pages from the OS disk buffer cache into the PostgreSQL `shared_buffers` in memory. Each row is located by a Tuple ID (TID) `(page_number, item_offset)`.",
            "stepByStep": [
              "1. PostgreSQL allocates 8KB disk pages per table file.",
              "2. New rows are written to available page space and assigned a 32-bit Item Pointer.",
              "3. Updates create a NEW tuple on a page and mark the old tuple dead (MVCC).",
              "4. Sequential Scans sequentially read every page from page 0 to page $N$."
            ],
            "workedExample": "Table with 1,000,000 rows (100 bytes per row) $\\to$ requires $\\sim 12,500$ 8KB pages (100 MB). A sequential scan must read all 12,500 pages into memory.",
            "realWorldUsage": "Database performance tuning, memory buffer sizing (`shared_buffers`), and storage architecture.",
            "codeSnippet": "-- Inspect PostgreSQL page layout and tuple sizes using pageinspect extension\nCREATE EXTENSION IF NOT EXISTS pageinspect;\n\nSELECT \n    relname,\n    relpages AS total_8kb_pages,\n    reltuples AS estimated_rows,\n    pg_size_pretty(pg_relation_size(oid)) AS table_size\nFROM pg_class\nWHERE relname = 'employees';",
            "codeExplanation": "1. `relpages` displays total number of 8KB disk blocks allocated to the table.\n2. `pg_relation_size` shows exact on-disk byte footprint.",
            "expectedOutput": "relname   | total_8kb_pages | estimated_rows | table_size\n----------+-----------------+----------------+------------\nemployees |             125 |          10000 | 1000 kB",
            "commonMistakes": "Assuming database engines read single individual rows from disk. Relational databases ALWAYS read full 8KB pages.",
            "bestPractices": "Design schema data types compactly (e.g. `smallint` vs `bigint`) to pack more tuples per 8KB page and reduce disk I/O.",
            "practiceTask": "Query `pg_class` to calculate the average number of tuples packed per page across your application tables.",
            "keyTakeaway": "Relational databases organize storage in 8KB disk blocks, making page I/O the primary determinant of query latency."
          },
          {
            "section": "Section 2 — B-Tree Indexing",
            "topic": "B-Tree Mechanics",
            "title": "Lesson 2 — B-Tree Index Mechanics, Covering Indexes & Index-Only Scans",
            "prerequisites": "Lesson 1 (PostgreSQL Storage Architecture).",
            "description": "B-Tree (Balanced Tree) indexes maintain sorted key structures across root, internal, and leaf pages, enabling $O(\\log N)$ point lookups and range scans.",
            "whyItMatters": "Without an index, querying 10M rows requires scanning 100,000 pages; a B-Tree finds the record in 3-4 page reads.",
            "howItWorks": "B-Tree leaf pages contain `(indexed_key, TID)` pairs linked as a bidirectional linked list for fast range scanning. Covering indexes (`INCLUDE`) store non-key columns directly in leaf nodes, avoiding expensive heap lookups.",
            "stepByStep": [
              "1. B-Tree root page guides lookup to appropriate child branch page.",
              "2. Traverses down to target leaf page in $O(\\log N)$ page reads.",
              "3. Leaf page provides TID `(block_id, offset)` pointing to table heap.",
              "4. Index-Only Scan: If all requested `SELECT` columns exist in index, heap access is skipped entirely."
            ],
            "workedExample": "Query: `SELECT email FROM users WHERE user_id = 450;`\nStandard Index on `user_id`: 3 index reads + 1 heap read.\nCovering Index `CREATE INDEX idx ON users (user_id) INCLUDE (email)`: 3 index reads + 0 heap reads (Index-Only Scan).",
            "realWorldUsage": "High-throughput transactional APIs, foreign key lookups, and primary key lookups.",
            "codeSnippet": "-- High-Performance Covering Index\nCREATE INDEX idx_employees_dept_salary \nON employees (department_id) \nINCLUDE (salary, email);\n\n-- This query executes as an ultra-fast Index-Only Scan\nEXPLAIN (ANALYZE, BUFFERS)\nSELECT department_id, salary, email\nFROM employees\nWHERE department_id = 4;",
            "codeExplanation": "1. `department_id` forms the sorted B-Tree search key.\n2. `INCLUDE (salary, email)` stores payload columns directly in leaf pages without bloating search tree key space.",
            "expectedOutput": "Index Only Scan using idx_employees_dept_salary on employees  (cost=0.29..4.30 rows=10 width=40) (actual time=0.015..0.020 rows=10 loops=1)\n  Heap Fetches: 0\n  Buffers: shared hit=3",
            "commonMistakes": "Adding too many columns to the search key (`CREATE INDEX (a, b, c, d)`) instead of using `INCLUDE`, which inflates non-leaf node sizes and increases B-Tree depth.",
            "bestPractices": "Use `INCLUDE` for columns that are only needed in the `SELECT` projection and never filtered in `WHERE` or `ORDER BY`.",
            "practiceTask": "Create a covering index on an active table and verify `Heap Fetches: 0` in `EXPLAIN ANALYZE`.",
            "keyTakeaway": "Covering indexes with INCLUDE eliminate heap table lookups entirely, executing queries as ultra-fast Index-Only Scans."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: B-Tree Index Optimization & Index-Only Scans\n\nRequirements:\n1. Seed a 1,000,000-row PostgreSQL table with employee transaction records.\n2. Benchmark baseline Sequential Scan latency on filtered queries.\n3. Create composite and covering B-Tree indexes with `INCLUDE` clauses.\n4. Verify that execution plan transitions from `Seq Scan` to `Index Only Scan` with `Heap Fetches: 0`.",
        "competencyVerification": "Demonstrates Level 4 relational storage comprehension, B-Tree index optimization, and Index-Only Scan configuration.",
        "resources": [
        {
                "title": "PostgreSQL Official Documentation: Indexes and Table Access Methods",
                "url": "https://www.postgresql.org/docs/current/indexes.html",
                "description": "B-Tree internal structure, BRIN indexing for time-series, GIN for JSONB/full-text, and GiST.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "Use The Index, Luke! A Guide to Database Performance for Developers",
                "url": "https://use-the-index-luke.com/",
                "description": "Comprehensive visual guide on index range scans, composite index order, and avoiding table scans.",
                "type": "guide",
                "provider": "Markus Winand"
        }
]
      }
    },
    {
      "id": "sql-mod-2",
      "order": 2,
      "title": "Module 2 — Query Execution Plans & `EXPLAIN ANALYZE` Deep Dive",
      "durationMinutes": 180,
      "summary": "Mastering PostgreSQL cost-based query optimizer plans: Sequential Scan, Index Scan, Bitmap Index Scan, join algorithms (Nested Loop, Hash Join, Merge Join), and buffer cache statistics.",
      "learningObjectives": [
        "Read and interpret execution tree plans generated by `EXPLAIN (ANALYZE, BUFFERS)`.",
        "Diagnose performance bottlenecks: filter misestimates, missing indexes, and sort spills.",
        "Analyze join algorithms: Nested Loop vs Hash Join vs Merge Join."
      ],
      "resources": [
        {
                "title": "PostgreSQL Official Documentation: Using EXPLAIN & Query Execution Plans",
                "url": "https://www.postgresql.org/docs/current/using-explain.html",
                "description": "Understanding cost estimates, actual startup/total time, loops, rows, and buffer hit metrics.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "Depesz: Explain PostgreSQL Query Visualizer & Analysis",
                "url": "https://explain.depesz.com/",
                "description": "Detailed walkthrough of sequential scans, index scans, bitmap heap scans, and hash joins.",
                "type": "guide",
                "provider": "Depesz"
        }
],
      "content": {
        "overview": "The PostgreSQL Cost-Based Optimizer converts SQL queries into an execution plan tree. Mastering `EXPLAIN ANALYZE` is the core skill for identifying and eliminating database latency.",
        "keyConcepts": [
          {
            "section": "Section 1 — Execution Plans & Scans",
            "topic": "Reading EXPLAIN Plans",
            "title": "Lesson 1 — Deconstructing `EXPLAIN (ANALYZE, BUFFERS)` Execution Trees",
            "prerequisites": "Module 1 (Storage & Indexes).",
            "description": "Understanding `EXPLAIN (ANALYZE, BUFFERS)`: estimated cost `(cost=startup..total)`, actual execution time, rows returned, loops, and shared buffer hits/reads.",
            "whyItMatters": "`EXPLAIN` without `ANALYZE` displays optimizer estimates; `EXPLAIN ANALYZE` actually runs the query and prints true runtime measurements.",
            "howItWorks": "Cost is measured in arbitrary I/O units (1.0 = 1 sequential page read). If actual rows diverge significantly from estimated rows, optimizer statistics (`pg_statistic`) are stale.",
            "stepByStep": [
              "1. Run `EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT ...`.",
              "2. Read tree from innermost nested node outwards.",
              "3. Check `Buffers: shared hit=X read=Y` (high read = disk I/O; high hit = RAM buffer hit).",
              "4. Compare `rows=estimated` vs `actual rows=N`: a 10x+ discrepancy indicates stale statistics (`ANALYZE table_name;`)."
            ],
            "workedExample": "Diagnosing slow query: Plan shows `Seq Scan on large_table (cost=0.00..18420.00 actual time=0.05..124.50 ms)` with `Buffers: shared read=12400`. Adding an index drops actual time to 0.4ms.",
            "realWorldUsage": "Production database query tuning, slow query log diagnosis, and index selection.",
            "codeSnippet": "-- Comprehensive Execution Plan Analysis\nEXPLAIN (ANALYZE, BUFFERS, COSTS, TIMING)\nSELECT e.name, e.salary, d.dept_name\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nWHERE e.salary > 85000\nORDER BY e.salary DESC\nLIMIT 10;",
            "codeExplanation": "1. `BUFFERS` reveals exact memory cache hits vs disk reads.\n2. Displays join algorithm selection and sorting overhead.",
            "expectedOutput": "Limit  (cost=42.10..42.12 rows=10 width=48) (actual time=0.850..0.855 rows=10 loops=1)\n  Buffers: shared hit=18\n  ->  Sort  (cost=42.10..43.50 rows=560 width=48) (actual time=0.848..0.851 rows=10 loops=1)\n        Sort Key: e.salary DESC\n        Sort Method: top-N heapsort  Memory: 26kB\n        ->  Hash Join  (cost=1.20..28.50 rows=560 width=48) (actual time=0.045..0.620 rows=560 loops=1)",
            "commonMistakes": "Running `EXPLAIN ANALYZE` on destructive `UPDATE` or `DELETE` statements without wrapping inside a `ROLLBACK` transaction.",
            "bestPractices": "Always run `EXPLAIN (ANALYZE, BUFFERS)` in staging with realistic data volumes; single-row test tables mask Sequential Scan degradation.",
            "practiceTask": "Analyze a complex multi-table query with `EXPLAIN (ANALYZE, BUFFERS)` and identify the node responsible for 80% of execution time.",
            "keyTakeaway": "EXPLAIN ANALYZE reveals the true physical execution steps, join strategies, and buffer I/O utilized by the query engine."
          },
          {
            "section": "Section 2 — Join Algorithms",
            "topic": "Join Strategies",
            "title": "Lesson 2 — Join Mechanics: Nested Loop vs Hash Join vs Merge Join",
            "prerequisites": "Lesson 1 (Reading EXPLAIN Plans).",
            "description": "The three fundamental physical join algorithms used by relational engines: Nested Loop ($O(N \\times M)$ or $O(N \\log M)$ with index), Hash Join ($O(N + M)$), and Merge Join ($O(N \\log N + M \\log M)$).",
            "whyItMatters": "Understanding join mechanics allows engineers to write queries and build indexes that guide the optimizer toward optimal join plans.",
            "howItWorks": "Nested Loop iterates outer table and probes inner index; Hash Join builds an in-memory hash table of the smaller table and probes with the larger table; Merge Join scans two pre-sorted inputs simultaneously.",
            "stepByStep": [
              "1. Nested Loop with Index: Optimal when outer table is tiny ($<100$ rows) and inner table has indexed foreign key.",
              "2. Hash Join: Optimal for large un-indexed datasets that fit inside `work_mem`.",
              "3. Merge Join: Optimal when both tables are large and already pre-sorted on join keys by a B-Tree index.",
              "4. If Hash Join spills to disk (`Batches > 1`), increase `work_mem`."
            ],
            "workedExample": "Joining 50,000 employees with 10 departments:\nHash Join builds hash table of 10 departments in 0.05ms, then streams 50k employees through the hash table in 12ms.",
            "realWorldUsage": "Architecting analytical data warehouses and high-speed relational OLTP backends.",
            "codeSnippet": "-- Observe Join Strategy selection\nSET work_mem = '64MB'; -- Ensures hash table fits entirely in RAM\n\nEXPLAIN (ANALYZE, BUFFERS)\nSELECT c.name, COUNT(o.id) AS total_orders\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nGROUP BY c.id, c.name;",
            "codeExplanation": "1. Shows optimizer selecting Hash Join when joining two unsorted tables.\n2. `work_mem` prevents hash batches from spilling to disk.",
            "expectedOutput": "HashAggregate  (cost=125.00..135.00 rows=1000 width=40) (actual time=4.200..4.500 rows=1000 loops=1)\n  ->  Hash Join  (cost=28.00..95.00 rows=6000 width=36) (actual time=0.450..2.800 rows=6000 loops=1)\n        Hash Cond: (o.customer_id = c.id)",
            "commonMistakes": "Allowing Hash Joins to spill to disk batches on heavy queries due to low default `work_mem` (4MB).",
            "bestPractices": "Ensure foreign key columns have B-Tree indexes to enable fast Nested Loop and Merge Joins.",
            "practiceTask": "Force PostgreSQL to use Nested Loop, Hash Join, and Merge Join using `SET enable_hashjoin = off;` and compare execution times.",
            "keyTakeaway": "Relational engines dynamically select between Nested Loop, Hash Join, and Merge Join based on table cardinality and index availability."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Query Plan Optimization & Join Diagnostics\n\nRequirements:\n1. Execute `EXPLAIN (ANALYZE, BUFFERS)` on an un-indexed multi-table join.\n2. Identify expensive Sequential Scans and disk-based sort spills.\n3. Add strategic composite indexes and tune `work_mem`.\n4. Reduce total execution time by $>80\\%$ and verify in the execution plan tree.",
        "competencyVerification": "Demonstrates Level 4 query plan analysis, cost-based optimizer comprehension, and join performance tuning.",
        "resources": [
        {
                "title": "PostgreSQL Official Documentation: Using EXPLAIN & Query Execution Plans",
                "url": "https://www.postgresql.org/docs/current/using-explain.html",
                "description": "Understanding cost estimates, actual startup/total time, loops, rows, and buffer hit metrics.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "Depesz: Explain PostgreSQL Query Visualizer & Analysis",
                "url": "https://explain.depesz.com/",
                "description": "Detailed walkthrough of sequential scans, index scans, bitmap heap scans, and hash joins.",
                "type": "guide",
                "provider": "Depesz"
        }
]
      }
    },
    {
      "id": "sql-mod-3",
      "order": 3,
      "title": "Module 3 — Complex Joins, Subqueries & Common Table Expressions (CTEs)",
      "durationMinutes": 180,
      "summary": "Mastering advanced SQL querying: Inner/Outer/Cross joins, correlated subqueries, Common Table Expressions (`WITH`), recursive CTEs for hierarchical tree structures, and materialization fences.",
      "learningObjectives": [
        "Write complex multi-table queries with INNER, LEFT, FULL OUTER, and CROSS joins.",
        "Construct modular Common Table Expressions (CTEs) and optimize CTE materialization.",
        "Implement recursive CTEs to traverse hierarchical organizational charts and graph structures."
      ],
      "resources": [
        {
                "title": "PostgreSQL Official Documentation: WITH Queries (Common Table Expressions)",
                "url": "https://www.postgresql.org/docs/current/queries-with.html",
                "description": "CTE optimization, MATERIALIZED vs NOT MATERIALIZED modifiers, and recursive CTEs.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "Modern SQL: Window Functions vs Subqueries",
                "url": "https://modern-sql.com/feature/window-functions",
                "description": "Writing clean, set-based analytical queries without self-joins or correlated subqueries.",
                "type": "article",
                "provider": "Modern SQL"
        }
],
      "content": {
        "overview": "CTEs and recursive queries transform complex business logic into readable, maintainable, and highly optimized SQL query pipelines.",
        "keyConcepts": [
          {
            "section": "Section 1 — Common Table Expressions & Modularity",
            "topic": "CTE Architecture",
            "title": "Lesson 1 — Common Table Expressions (CTEs) & Materialization Optimization",
            "prerequisites": "Module 2 (Query Execution Plans).",
            "description": "Common Table Expressions (`WITH` queries) define temporary named result sets that exist within the scope of a single query, improving readability and modularity.",
            "whyItMatters": "Deeply nested subqueries are hard to read and debug; CTEs break logic into sequential, readable pipeline steps.",
            "howItWorks": "In PostgreSQL 12+, CTEs are inlined automatically into the parent query by the optimizer unless explicitly declared with `WITH cte AS MATERIALIZED (...)`.",
            "stepByStep": [
              "1. Define CTE with `WITH cte_name AS (SELECT ...) `.",
              "2. Chain multiple CTEs with commas.",
              "3. Reference earlier CTEs in subsequent CTE definitions.",
              "4. Use `MATERIALIZED` only when you need an optimization fence to prevent duplicate expensive subquery execution."
            ],
            "workedExample": "Calculating department salary rankings: CTE 1 aggregates department statistics -> CTE 2 joins with individual employees -> Main query filters employees above department 90th percentile.",
            "realWorldUsage": "Complex financial reporting, payroll calculations, and ETL transformations.",
            "codeSnippet": "-- Clean Modular Multi-Stage CTE\nWITH DeptMetrics AS (\n    SELECT \n        department_id,\n        AVG(salary) AS avg_salary,\n        COUNT(*) AS head_count\n    FROM employees\n    GROUP BY department_id\n),\nTopEarners AS (\n    SELECT \n        e.id, e.name, e.salary, e.department_id,\n        d.avg_salary\n    FROM employees e\n    JOIN DeptMetrics d ON e.department_id = d.department_id\n    WHERE e.salary > d.avg_salary * 1.25\n)\nSELECT name, salary, ROUND(avg_salary, 2) AS dept_avg\nFROM TopEarners\nORDER BY salary DESC;",
            "codeExplanation": "1. `DeptMetrics` computes department baseline.\n2. `TopEarners` filters employees exceeding 125% of department mean in a clean, readable pipeline.",
            "expectedOutput": "name          | salary   | dept_avg\n--------------+----------+----------\nSarah Jenkins | 145000.0 | 95000.00\nRavi Kumar    | 120000.0 | 95000.00",
            "commonMistakes": "Overusing `MATERIALIZED` on small CTEs, which prevents the optimizer from pushing down `WHERE` predicate filters into the subquery.",
            "bestPractices": "Write CTEs for readability and let the modern cost-based optimizer handle query inlining automatically.",
            "practiceTask": "Refactor a 4-level nested subquery into a clean, sequential 3-stage CTE pipeline.",
            "keyTakeaway": "CTEs structure complex SQL into readable sequential transformations that the optimizer inlines for maximum execution speed."
          },
          {
            "section": "Section 2 — Hierarchical & Recursive Queries",
            "topic": "Recursive CTEs",
            "title": "Lesson 2 — Recursive CTEs: Traversing Organizational Hierarchies & Trees",
            "prerequisites": "Lesson 1 (CTEs).",
            "description": "Recursive CTEs (`WITH RECURSIVE`) iteratively traverse hierarchical parent-child relationships (e.g. employee-manager org charts, category trees, dependency graphs).",
            "whyItMatters": "Standard SQL cannot query arbitrary-depth parent-child trees without recursive self-referencing loops.",
            "howItWorks": "A recursive CTE consists of an Anchor Member (base query), `UNION ALL`, and a Recursive Member that references the CTE name until an empty set is returned.",
            "stepByStep": [
              "1. Define `WITH RECURSIVE org_chart AS (...)`.",
              "2. Anchor Member: `SELECT id, name, manager_id, 1 AS depth FROM employees WHERE manager_id IS NULL`.",
              "3. `UNION ALL`.",
              "4. Recursive Member: `SELECT e.id, e.name, e.manager_id, o.depth + 1 FROM employees e JOIN org_chart o ON e.manager_id = o.id`.",
              "5. Terminate when no child records match."
            ],
            "workedExample": "Organizational Hierarchy: Finding all direct and indirect reports under the CTO across 6 management levels in a single query.",
            "realWorldUsage": "Bill of materials (BOM), org charts, category trees, and route graph traversals.",
            "codeSnippet": "-- Recursive Hierarchy Traversal\nWITH RECURSIVE OrgHierarchy AS (\n    -- Anchor: Top-Level Executives (no manager)\n    SELECT id, name, manager_id, 1 AS level, ARRAY[name::text] AS path\n    FROM employees\n    WHERE manager_id IS NULL\n    \n    UNION ALL\n    \n    -- Recursive: Find direct reports of current level\n    SELECT e.id, e.name, e.manager_id, h.level + 1, h.path || e.name::text\n    FROM employees e\n    JOIN OrgHierarchy h ON e.manager_id = h.id\n)\nSELECT level, name, array_to_string(path, ' -> ') AS reporting_chain\nFROM OrgHierarchy\nORDER BY path;",
            "codeExplanation": "1. Anchor query selects root leadership.\n2. Recursive query joins employee table with the ongoing CTE until full depth is traversed.",
            "expectedOutput": "level | name          | reporting_chain\n------+---------------+-------------------------------------------\n    1 | Sarah Jenkins | Sarah Jenkins\n    2 | Ravi Kumar    | Sarah Jenkins -> Ravi Kumar\n    3 | Alex Rivera   | Sarah Jenkins -> Ravi Kumar -> Alex Rivera",
            "commonMistakes": "Omitting cycle detection in graph data with loops, causing infinite recursive loops. Use array path checks (`NOT (e.id = ANY(path))`) to prevent cycles.",
            "bestPractices": "Always track traversal depth with a `level` counter and build a `path` array for clear breadcrumb lineage.",
            "practiceTask": "Write a recursive CTE that traverses a category tree and returns the full breadcrumb path for every leaf product category.",
            "keyTakeaway": "Recursive CTEs provide a native, high-performance mechanism for querying arbitrary-depth hierarchical and graph data."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Hierarchical Org Chart & Multi-Level Financial Reporting\n\nRequirements:\n1. Construct a recursive CTE traversing a 5-level deep company management tree.\n2. Track organizational depth and full reporting breadcrumb chains.\n3. Aggregate departmental headcount and total payroll dynamically up the management chain.",
        "competencyVerification": "Demonstrates Level 4 mastery of complex joins, Common Table Expressions, and recursive tree traversal.",
        "resources": [
        {
                "title": "PostgreSQL Official Documentation: WITH Queries (Common Table Expressions)",
                "url": "https://www.postgresql.org/docs/current/queries-with.html",
                "description": "CTE optimization, MATERIALIZED vs NOT MATERIALIZED modifiers, and recursive CTEs.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "Modern SQL: Window Functions vs Subqueries",
                "url": "https://modern-sql.com/feature/window-functions",
                "description": "Writing clean, set-based analytical queries without self-joins or correlated subqueries.",
                "type": "article",
                "provider": "Modern SQL"
        }
]
      }
    },
    {
      "id": "sql-mod-4",
      "order": 4,
      "title": "Module 4 — Advanced Window Functions & Analytical SQL",
      "durationMinutes": 180,
      "summary": "Mastering analytical SQL with Window Functions: `OVER (PARTITION BY ... ORDER BY ...)`, ranking (`ROW_NUMBER`, `DENSE_RANK`), offsets (`LAG`, `LEAD`), running totals, and sliding frame bounds.",
      "learningObjectives": [
        "Differentiate Window Functions from GROUP BY aggregations without collapsing row sets.",
        "Apply ranking and offset functions (`ROW_NUMBER`, `DENSE_RANK`, `LAG`, `LEAD`) for period-over-period calculations.",
        "Construct custom sliding window frames (`ROWS BETWEEN ... PRECEDING AND CURRENT ROW`) for rolling averages."
      ],
      "resources": [
        {
                "title": "PostgreSQL Official Documentation: Window Functions",
                "url": "https://www.postgresql.org/docs/current/tutorial-window.html",
                "description": "OVER clause, PARTITION BY, ORDER BY, frame specifications (ROWS BETWEEN), and ranking functions.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "PostgreSQL Official Documentation: General-Purpose Window Functions Reference",
                "url": "https://www.postgresql.org/docs/current/functions-window.html",
                "description": "ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD(), FIRST_VALUE(), and NTILE().",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        }
],
      "content": {
        "overview": "Window functions perform calculations across sets of table rows that are related to the current row, retaining individual row identities while computing comparative and running metrics.",
        "keyConcepts": [
          {
            "section": "Section 1 — Window Foundations & Ranking",
            "topic": "Ranking & Offsets",
            "title": "Lesson 1 — Ranking & Period-over-Period Offsets: `ROW_NUMBER`, `DENSE_RANK`, `LAG` & `LEAD`",
            "prerequisites": "Module 3 (CTEs).",
            "description": "Window functions evaluate calculations across partitions without collapsing individual rows like `GROUP BY`. `ROW_NUMBER()` assigns sequential IDs; `DENSE_RANK()` ranks values without gaps; `LAG()` and `LEAD()` access adjacent rows.",
            "whyItMatters": "Calculating month-over-month growth or top-3 salaries per department requires cumbersome self-joins without window functions.",
            "howItWorks": "`OVER (PARTITION BY department_id ORDER BY salary DESC)` partitions data into virtual windows and computes rank/offset values in a single pass.",
            "stepByStep": [
              "1. Specify function: `DENSE_RANK() OVER (...)` or `LAG(metric, 1) OVER (...)`.",
              "2. Define `PARTITION BY` key (resets calculation boundary per group).",
              "3. Define `ORDER BY` key (determines sequence order within partition).",
              "4. Wrap in CTE to filter `WHERE rank <= 3` (window functions cannot appear directly in `WHERE`)."
            ],
            "workedExample": "Computing Month-over-Month Revenue Growth:\n`revenue - LAG(revenue, 1) OVER (ORDER BY month)`\nInstantly yields the absolute delta and percentage growth compared to the prior month.",
            "realWorldUsage": "Financial trend analysis, leaderboard rankings, and deduplication workflows.",
            "codeSnippet": "-- Top 2 Highest Paid Employees Per Department\nWITH RankedStaff AS (\n    SELECT \n        id, name, department_id, salary,\n        DENSE_RANK() OVER (\n            PARTITION BY department_id \n            ORDER BY salary DESC\n        ) AS rank_in_dept,\n        LAG(salary, 1) OVER (\n            PARTITION BY department_id \n            ORDER BY salary DESC\n        ) AS next_higher_salary\n    FROM employees\n)\nSELECT name, department_id, salary, rank_in_dept, (next_higher_salary - salary) AS gap_to_leader\nFROM RankedStaff\nWHERE rank_in_dept <= 2;",
            "codeExplanation": "1. `PARTITION BY department_id` isolates ranks per department.\n2. `LAG` accesses previous salary in the ranked partition.",
            "expectedOutput": "name          | department_id | salary   | rank_in_dept | gap_to_leader\n--------------+---------------+----------+--------------+--------------\nSarah Jenkins |             1 | 145000.0 |            1 |         NULL\nRavi Kumar    |             1 | 120000.0 |            2 |      25000.0",
            "commonMistakes": "Attempting to put window functions directly into the `WHERE` clause (`WHERE ROW_NUMBER() OVER (...) <= 3`); window functions execute after `WHERE` and require a CTE wrapper.",
            "bestPractices": "Use `DENSE_RANK` when ties should share ranks without skipping subsequent rank numbers; use `ROW_NUMBER` for strict deterministic pagination.",
            "practiceTask": "Write a query using `LEAD()` to calculate the number of days between consecutive user login events.",
            "keyTakeaway": "Window functions enable sophisticated ranking and offset calculations across row partitions without collapsing result sets."
          },
          {
            "section": "Section 2 — Sliding Frames & Running Totals",
            "topic": "Sliding Window Frames",
            "title": "Lesson 2 — Running Totals, Moving Averages & Sliding Frame Boundaries",
            "prerequisites": "Lesson 1 (Ranking & Offsets).",
            "description": "Constructing running aggregates and moving averages using explicit window frame clauses: `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`.",
            "whyItMatters": "Smoothing noisy daily data into 7-day or 30-day moving averages is essential for identifying true underlying business trends.",
            "howItWorks": "Frame clauses specify which subset of rows within the partition are included in the calculation relative to the current row (`PRECEDING`, `CURRENT ROW`, `FOLLOWING`).",
            "stepByStep": [
              "1. Default frame when `ORDER BY` is present: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` (Running Total).",
              "2. Explicit sliding frame: `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` (7-day Moving Average).",
              "3. Centered moving average: `ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING`.",
              "4. Compute percentage of total: `salary / SUM(salary) OVER (PARTITION BY department_id)`."
            ],
            "workedExample": "Calculating 7-day Moving Average Revenue:\n`AVG(daily_revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`\nSmooths weekend dips into a clear weekly trend line.",
            "realWorldUsage": "Executive KPI dashboards, real-time metrics smoothing, and financial portfolio tracking.",
            "codeSnippet": "-- Running Total & 3-Day Moving Average\nSELECT \n    sale_date,\n    amount,\n    SUM(amount) OVER (\n        ORDER BY sale_date \n        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n    ) AS cumulative_revenue,\n    AVG(amount) OVER (\n        ORDER BY sale_date \n        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n    ) AS moving_avg_3day\nFROM daily_sales\nORDER BY sale_date;",
            "codeExplanation": "1. `UNBOUNDED PRECEDING` calculates running cumulative sum.\n2. `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` calculates 3-day moving average.",
            "expectedOutput": "sale_date  | amount | cumulative_revenue | moving_avg_3day\n-----------+--------+--------------------+-----------------\n2026-01-01 |  100.0 |              100.0 |          100.00\n2026-01-02 |  150.0 |              250.0 |          125.00\n2026-01-03 |  200.0 |              450.0 |          150.00\n2026-01-04 |  250.0 |              700.0 |          200.00",
            "commonMistakes": "Using `RANGE` instead of `ROWS` with duplicate values in the `ORDER BY` column, which bundles identical timestamps into a single combined calculation.",
            "bestPractices": "Always explicitly declare `ROWS BETWEEN ...` when calculating moving averages to ensure deterministic sliding windows.",
            "practiceTask": "Calculate both the running cumulative sum and the 30-day rolling standard deviation of daily active users.",
            "keyTakeaway": "Explicit window frame boundaries provide precise control over moving averages, rolling trends, and cumulative running totals."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Analytical Sales & Competency Trend Engine\n\nRequirements:\n1. Construct an analytical query computing monthly competency score progressions.\n2. Calculate Month-over-Month score delta using `LAG()`.\n3. Compute a 3-month centered moving average using explicit sliding window frames.\n4. Determine employee percentile rank within their department using `CUME_DIST()`.",
        "competencyVerification": "Demonstrates Level 4 analytical SQL mastery, window function partitioning, and sliding frame engineering.",
        "resources": [
        {
                "title": "PostgreSQL Official Documentation: Window Functions",
                "url": "https://www.postgresql.org/docs/current/tutorial-window.html",
                "description": "OVER clause, PARTITION BY, ORDER BY, frame specifications (ROWS BETWEEN), and ranking functions.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "PostgreSQL Official Documentation: General-Purpose Window Functions Reference",
                "url": "https://www.postgresql.org/docs/current/functions-window.html",
                "description": "ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD(), FIRST_VALUE(), and NTILE().",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        }
]
      }
    },
    {
      "id": "sql-mod-5",
      "order": 5,
      "title": "Module 5 — Schema Normalization, Partitioning & Concurrency Control",
      "durationMinutes": 180,
      "summary": "Database normalization (1NF to BCNF), table partitioning strategies (Range, Hash, List), PostgreSQL Multi-Version Concurrency Control (MVCC), transaction isolation levels, and vacuum bloat management.",
      "learningObjectives": [
        "Apply normalization rules (1NF, 2NF, 3NF, BCNF) to eliminate redundancy and update anomalies.",
        "Implement declarative Range and Hash Table Partitioning for multi-million row tables.",
        "Explain PostgreSQL MVCC internals, transaction isolation levels (Read Committed vs Serializable), and vacuum bloat management."
      ],
      "resources": [
        {
                "title": "PostgreSQL Official Documentation: Concurrency Control & MVCC",
                "url": "https://www.postgresql.org/docs/current/mvcc.html",
                "description": "Multi-Version Concurrency Control, transaction isolation levels (Read Committed, Serializable), and deadlocks.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "PostgreSQL Official Documentation: Routine Vacuuming and Autovacuum Tuning",
                "url": "https://www.postgresql.org/docs/current/routine-vacuuming.html",
                "description": "Reclaiming dead tuples, preventing transaction ID wraparound, and tuning vacuum freeze parameters.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        }
],
      "content": {
        "overview": "Production database reliability requires normalized schemas, horizontal table partitioning to bound table growth, and deep understanding of MVCC concurrency control.",
        "keyConcepts": [
          {
            "section": "Section 1 — Partitioning & Scalability",
            "topic": "Table Partitioning",
            "title": "Lesson 1 — Declarative Table Partitioning: Range, Hash & Partition Pruning",
            "prerequisites": "Module 1 (Relational Storage).",
            "description": "Declarative table partitioning splits a massive logical table into smaller physical partition tables by Range (e.g. date), Hash (e.g. user ID), or List (e.g. region).",
            "whyItMatters": "Tables exceeding 100M rows suffer from massive index degradation and slow maintenance operations (vacuuming, backups). Partitioning bounds each physical file size.",
            "howItWorks": "The query planner applies Partition Pruning to automatically skip scanning partitions whose constraint ranges do not match the query's `WHERE` clause.",
            "stepByStep": [
              "1. Create partitioned master table: `CREATE TABLE logs (...) PARTITION BY RANGE (created_at)`.",
              "2. Create child partitions: `CREATE TABLE logs_2026_q1 PARTITION OF logs FOR VALUES FROM ('2026-01-01') TO ('2026-04-01')`.",
              "3. Ensure `enable_partition_pruning = on`.",
              "4. Drop obsolete historical data instantly with `DROP TABLE logs_2024_q1;` ($O(1)$ time, zero vacuum bloat)."
            ],
            "workedExample": "Querying 1 week of logs from a 500M row audit table: Partition pruning scans only 1 child partition (35MB) instead of the full 500M master table (25GB).",
            "realWorldUsage": "Time-series metrics, financial ledger history, and multi-tenant SaaS databases.",
            "codeSnippet": "-- Declarative Range Partitioning\nCREATE TABLE audit_logs (\n    id BIGSERIAL,\n    event_type VARCHAR(50),\n    created_at TIMESTAMP NOT NULL,\n    payload JSONB,\n    PRIMARY KEY (id, created_at)\n) PARTITION BY RANGE (created_at);\n\n-- Create Q1 2026 Partition\nCREATE TABLE audit_logs_2026_q1 PARTITION OF audit_logs\n    FOR VALUES FROM ('2026-01-01 00:00:00') TO ('2026-04-01 00:00:00');",
            "codeExplanation": "1. `PARTITION BY RANGE (created_at)` establishes master routing.\n2. Child partition physically isolates Q1 data.",
            "expectedOutput": "CREATE TABLE\nCREATE TABLE",
            "commonMistakes": "Partitioning tables that have fewer than 1,000,000 rows; partitioning introduces slight query planner overhead that is only beneficial at large scale.",
            "bestPractices": "Always include the partition key column in the table's Primary Key and Unique constraints.",
            "practiceTask": "Create a range-partitioned table for daily sensor metrics and verify partition pruning using `EXPLAIN`.",
            "keyTakeaway": "Declarative table partitioning bounds physical file sizes and enables partition pruning for sub-second queries on billion-row datasets."
          },
          {
            "section": "Section 2 — Concurrency & MVCC",
            "topic": "MVCC & Isolation",
            "title": "Lesson 2 — Multi-Version Concurrency Control (MVCC) & Transaction Isolation",
            "prerequisites": "Module 1 (Relational Storage).",
            "description": "PostgreSQL uses Multi-Version Concurrency Control (MVCC) where readers never block writers and writers never block readers. Every tuple stores `xmin` (creation transaction ID) and `xmax` (deletion transaction ID).",
            "whyItMatters": "Understanding MVCC explains why `UPDATE` creates table bloat and how isolation levels prevent race conditions (Dirty Reads, Non-Repeatable Reads, Phantom Reads).",
            "howItWorks": "Read Committed isolation takes a snapshot at the start of each statement; Repeatable Read takes a snapshot at the start of the transaction; Serializable detects read-write conflict dependencies (SSI).",
            "stepByStep": [
              "1. PostgreSQL assigns monotonic 32-bit transaction IDs (XID).",
              "2. `UPDATE` writes a new tuple with `xmin = current_XID` and sets old tuple's `xmax = current_XID`.",
              "3. `VACUUM` cleans up dead tuples (`xmax < oldest_active_XID`) and reclaims free space.",
              "4. Use `SELECT ... FOR UPDATE` for pessimistic row locking in concurrent balance transfers."
            ],
            "workedExample": "Concurrent Bank Balance Transfer: Without pessimistic locking, two simultaneous $50 withdrawals on a $60 balance both succeed (race condition). `SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;` serializes access safely.",
            "realWorldUsage": "E-commerce inventory reservation, financial ledger transfers, and ticket seat booking.",
            "codeSnippet": "-- Safe Concurrent Balance Deduction with Pessimistic Locking\nBEGIN;\n\nSELECT balance \nFROM user_wallets \nWHERE user_id = 450 \nFOR UPDATE; -- Locks the row from concurrent transactions\n\nUPDATE user_wallets \nSET balance = balance - 50.00 \nWHERE user_id = 450;\n\nCOMMIT;",
            "codeExplanation": "1. `FOR UPDATE` places an exclusive row-level lock.\n2. Prevents concurrent transactions from reading stale balance until commit.",
            "expectedOutput": "BEGIN\n balance \n---------\n  150.00\nUPDATE 1\nCOMMIT",
            "commonMistakes": "Running long-running analytical queries inside `REPEATABLE READ` transactions on busy OLTP databases, which prevents autovacuum from cleaning dead tuples.",
            "bestPractices": "Keep write transactions as short as possible and monitor table bloat using `pg_stat_user_tables`.",
            "practiceTask": "Simulate two concurrent transactions in separate terminals attempting to update the same row and observe lock wait behavior.",
            "keyTakeaway": "MVCC enables non-blocking concurrent reads while transaction isolation levels and row locks protect data integrity."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Table Partitioning & Concurrency Stress Testing\n\nRequirements:\n1. Construct a range-partitioned database schema for time-series audit logs.\n2. Write a Python concurrency script simulating 50 simultaneous transactions updating shared account balances.\n3. Implement `SELECT FOR UPDATE` pessimistic locking and verify zero balance inconsistencies under stress.",
        "competencyVerification": "Demonstrates Level 4 database schema architecture, declarative partitioning, and MVCC concurrency control.",
        "resources": [
        {
                "title": "PostgreSQL Official Documentation: Concurrency Control & MVCC",
                "url": "https://www.postgresql.org/docs/current/mvcc.html",
                "description": "Multi-Version Concurrency Control, transaction isolation levels (Read Committed, Serializable), and deadlocks.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        },
        {
                "title": "PostgreSQL Official Documentation: Routine Vacuuming and Autovacuum Tuning",
                "url": "https://www.postgresql.org/docs/current/routine-vacuuming.html",
                "description": "Reclaiming dead tuples, preventing transaction ID wraparound, and tuning vacuum freeze parameters.",
                "type": "documentation",
                "provider": "PostgreSQL Documentation"
        }
]
      }
    }
  ]
};
