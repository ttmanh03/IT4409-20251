# KIẾN TRÚC DATABASE CHO HỆ THỐNG PHÂN QUYỀN 3 CẤP
## Phân tích chi tiết và mục đích từng thành phần

---

## TỔNG QUAN KIẾN TRÚC

### Nguyên tắc thiết kế
1. **Separation of Concerns**: Tách biệt rõ ràng giữa User, Project, Permission
2. **Flexibility**: Một user có thể có nhiều roles khác nhau ở các projects khác nhau
3. **Auditability**: Theo dõi được ai làm gì, khi nào
4. **Ownership Tracking**: Phân biệt rõ Reporter vs Assignee
5. **Performance**: Index hợp lý cho các queries phổ biến
6. **Data Integrity**: Foreign keys và constraints đầy đủ

---

## 1. NHÓM TABLES: USER & AUTHENTICATION

### 1.1. Table `users`

**Mục đích**: Lưu thông tin cơ bản của người dùng trong toàn hệ thống

```
users
├── id (PK)                    # Định danh duy nhất
├── email (UNIQUE)             # Đăng nhập + liên lạc
├── username (UNIQUE)          # Hiển thị, @mention
├── password_hash              # Bảo mật
├── full_name                  # Tên đầy đủ
├── avatar_url                 # Ảnh đại diện
├── status                     # active/inactive/suspended
├── last_login_at              # Tracking hoạt động
├── created_at                 # Audit trail
└── updated_at                 # Audit trail
```

**Chi tiết fields:**

- **id**: UUID hoặc BIGINT AUTO_INCREMENT
  - Khóa chính, immutable
  - Dùng làm reference cho tất cả các bảng khác
  
- **email**: VARCHAR(255), UNIQUE, NOT NULL
  - Dùng để đăng nhập
  - Dùng để gửi notifications
  - Phải validate format email
  - Case-insensitive (lưu lowercase)
  
- **username**: VARCHAR(50), UNIQUE, NOT NULL
  - Dùng để @mention trong comments
  - Dùng để hiển thị trong UI
  - Chỉ cho phép: a-z, 0-9, underscore, dash
  - Case-insensitive
  
- **password_hash**: VARCHAR(255), NOT NULL
  - Mã hóa bằng bcrypt/argon2
  - KHÔNG BAO GIỜ lưu plain password
  - Độ dài đủ cho future-proof algorithms
  
- **full_name**: VARCHAR(100)
  - Tên hiển thị chính thức
  - Hỗ trợ Unicode (tiếng Việt có dấu)
  - Nullable (user có thể không điền)
  
- **avatar_url**: VARCHAR(500)
  - Link đến ảnh đại diện
  - Có thể là CDN URL hoặc local storage path
  - Nullable (có default avatar)
  
- **status**: ENUM('active', 'inactive', 'suspended')
  - **active**: Người dùng bình thường
  - **inactive**: Tạm khóa (nghỉ việc, chuyển team)
  - **suspended**: Vi phạm policy, bị admin khóa
  - Default: 'active'
  
- **last_login_at**: TIMESTAMP
  - Theo dõi hoạt động cuối
  - Dùng cho security monitoring
  - Phát hiện accounts không active
  
- **created_at**: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
  - Thời điểm tạo account
  - Immutable
  - Dùng cho analytics
  
- **updated_at**: TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP
  - Thời điểm update thông tin gần nhất
  - Auto-update khi có thay đổi

**Indexes cần thiết:**
```sql
INDEX idx_email ON users(email)           -- Login lookup
INDEX idx_username ON users(username)     -- @mention lookup  
INDEX idx_status ON users(status)         -- Filter active users
INDEX idx_last_login ON users(last_login_at)  -- Activity reports
```

**Use cases chính:**
1. Authentication: Kiểm tra email + password
2. User profile: Hiển thị thông tin cá nhân
3. @Mention: Tìm user theo username
4. Activity tracking: Theo dõi last_login
5. Admin management: Filter users theo status

---

## 2. NHÓM TABLES: PROJECT MANAGEMENT

### 2.1. Table `projects`

**Mục đích**: Quản lý các dự án - đơn vị tổ chức cao nhất trong hệ thống

```
projects
├── id (PK)
├── name                       # Tên project
├── key                        # Mã ngắn gọn (VD: PROJ)
├── description                # Mô tả dự án
├── owner_id (FK → users)      # Người tạo/sở hữu project
├── status                     # planning/active/archived
├── visibility                 # private/team/public
├── start_date                 # Ngày bắt đầu
├── end_date                   # Ngày kết thúc (dự kiến)
├── created_at
└── updated_at
```

**Chi tiết fields:**

- **id**: UUID/BIGINT
  - Primary key
  - Immutable
  
- **name**: VARCHAR(200), NOT NULL
  - Tên đầy đủ của project
  - VD: "E-commerce Website Redesign"
  - Phải unique trong workspace (nếu có multi-tenancy)
  - Có thể chứa Unicode
  
- **key**: VARCHAR(10), UNIQUE, NOT NULL
  - Mã viết tắt dùng cho task IDs
  - VD: "PROJ" → tasks sẽ là PROJ-1, PROJ-2...
  - Chỉ cho phép: A-Z, 0-9
  - Uppercase only
  - Độ dài: 2-10 ký tự
  
- **description**: TEXT
  - Mô tả chi tiết về project
  - Markdown support
  - Nullable
  
- **owner_id**: BIGINT, FK → users(id), NOT NULL
  - User tạo project
  - Thường là Admin đầu tiên
  - Có thể transfer ownership
  - ON DELETE RESTRICT (không xóa được user nếu còn own projects)
  
- **status**: ENUM('planning', 'active', 'on_hold', 'completed', 'archived')
  - **planning**: Đang lên kế hoạch, chưa bắt đầu
  - **active**: Đang chạy
  - **on_hold**: Tạm dừng
  - **completed**: Hoàn thành nhưng còn cần maintenance
  - **archived**: Đóng băng, read-only
  
- **visibility**: ENUM('private', 'team', 'public')
  - **private**: Chỉ members mới thấy
  - **team**: Team/department thấy
  - **public**: Mọi người trong company thấy
  - Ảnh hưởng đến việc discover projects
  
- **start_date**, **end_date**: DATE
  - Timeline của project
  - Nullable
  - Dùng cho Gantt charts, reports

**Indexes:**
```sql
INDEX idx_key ON projects(key)            -- Task prefix lookup
INDEX idx_owner ON projects(owner_id)     -- Owner's projects
INDEX idx_status ON projects(status)      -- Filter active projects
INDEX idx_visibility ON projects(visibility)  -- Access control
```

**Use cases:**
1. List projects: User xem tất cả projects họ tham gia
2. Create task: Cần project.key để generate task ID
3. Access control: Check visibility trước khi cho xem
4. Reports: Filter theo status để tính metrics
5. Archive: Chuyển old projects sang archived

---

### 2.2. Table `project_members`

**Mục đích**: Bảng join table - Mapping giữa Users và Projects với Roles

**Vai trò then chốt**: Đây là bảng QUAN TRỌNG NHẤT cho phân quyền!

```
project_members
├── id (PK)
├── project_id (FK → projects)
├── user_id (FK → users)
├── role                       # viewer/member/admin
├── joined_at                  # Thời điểm join
├── invited_by (FK → users)    # Ai mời vào
├── status                     # active/invited/removed
├── created_at
└── updated_at

UNIQUE KEY (project_id, user_id)  -- Mỗi user chỉ có 1 role/project
```

**Chi tiết fields:**

- **id**: BIGINT, PK
  - Primary key của bảng join
  
- **project_id**: BIGINT, FK, NOT NULL
  - Project nào
  - ON DELETE CASCADE (xóa project → xóa tất cả members)
  
- **user_id**: BIGINT, FK, NOT NULL
  - User nào
  - ON DELETE CASCADE (xóa user → xóa khỏi projects)
  
- **role**: ENUM('viewer', 'member', 'admin'), NOT NULL
  - **viewer**: Read-only, chỉ comment
  - **member**: Quản lý own tasks
  - **admin**: Full control
  - Default: 'member'
  - **KHÔNG thể NULL** - must have a role
  
- **joined_at**: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - Thời điểm chính thức join project
  - Khác với created_at nếu có invitation process
  
- **invited_by**: BIGINT, FK → users(id), NULLABLE
  - Admin nào mời user này vào
  - Nullable (vì owner tự join, không ai mời)
  - Dùng cho audit: "Ai add user này vào?"
  
- **status**: ENUM('active', 'invited', 'removed'), NOT NULL
  - **active**: Đang làm việc bình thường
  - **invited**: Đã gửi lời mời, chưa accept
  - **removed**: Đã remove khỏi project (soft delete)
  - Default: 'active'

**Unique Constraint quan trọng:**
```sql
UNIQUE KEY uk_project_user (project_id, user_id)
```
- Đảm bảo 1 user chỉ có duy nhất 1 role trong 1 project
- Ngăn duplicate memberships
- Database-level enforcement (không phụ thuộc application logic)

**Indexes:**
```sql
INDEX idx_project ON project_members(project_id)  -- List members of project
INDEX idx_user ON project_members(user_id)        -- List projects of user
INDEX idx_role ON project_members(project_id, role)  -- Count admins/members
INDEX idx_status ON project_members(status)       -- Filter active members
INDEX idx_invited_by ON project_members(invited_by)  -- Who invited whom
```

**Use cases QUAN TRỌNG:**

**UC1: Check permission**
```sql
-- User có quyền gì trong project này?
SELECT role 
FROM project_members 
WHERE project_id = ? AND user_id = ? AND status = 'active'
```

**UC2: List project members**
```sql
-- Xem tất cả members trong project
SELECT u.*, pm.role, pm.joined_at
FROM project_members pm
JOIN users u ON pm.user_id = u.id
WHERE pm.project_id = ? AND pm.status = 'active'
ORDER BY pm.role DESC, u.full_name
```

**UC3: List user's projects**
```sql
-- User tham gia những projects nào?
SELECT p.*, pm.role
FROM projects p
JOIN project_members pm ON p.id = pm.project_id
WHERE pm.user_id = ? AND pm.status = 'active'
```

**UC4: Count admins**
```sql
-- Project có bao nhiêu admins?
SELECT COUNT(*) as admin_count
FROM project_members
WHERE project_id = ? AND role = 'admin' AND status = 'active'
```

**UC5: Add member**
```sql
-- Admin thêm user vào project
INSERT INTO project_members (project_id, user_id, role, invited_by, status)
VALUES (?, ?, 'member', ?, 'active')
```

**Lý do thiết kế này:**

1. **Many-to-Many Relationship**
   - 1 User → Many Projects
   - 1 Project → Many Users
   - Join table là giải pháp chuẩn

2. **Role per Project**
   - User có thể là Admin ở Project A
   - Nhưng chỉ là Member ở Project B
   - Flexibility cao

3. **Audit Trail**
   - Biết ai mời vào (invited_by)
   - Biết khi nào join (joined_at)
   - Tracking changes (created_at, updated_at)

4. **Soft Delete**
   - status = 'removed' thay vì DELETE
   - Giữ lại history
   - Có thể restore nếu cần

---

## 3. NHÓM TABLES: TASK MANAGEMENT

### 3.1. Table `tasks`

**Mục đích**: Core entity - Lưu trữ tất cả công việc trong hệ thống

**Vai trò**: Đây là bảng trung tâm, hầu hết các operations đều liên quan đến tasks

```
tasks
├── id (PK)
├── project_id (FK → projects)
├── task_number                # Số thứ tự trong project
├── title                      # Tiêu đề ngắn gọn
├── description                # Mô tả chi tiết
├── type                       # task/bug/story/epic
├── status                     # backlog/todo/in_progress/done...
├── priority                   # lowest/low/medium/high/highest
├── reporter_id (FK → users)   # Người TẠO task ⭐
├── assignee_id (FK → users)   # Người ĐƯỢC GIAO ⭐
├── due_date                   # Deadline
├── estimated_hours            # Ước tính thời gian
├── actual_hours               # Thực tế đã làm
├── parent_task_id (FK → tasks)# Task cha (subtasks)
├── sprint_id (FK → sprints)   # Thuộc sprint nào
├── created_at
└── updated_at
```

**Chi tiết fields - PHẦN QUAN TRỌNG NHẤT:**

**Identification Fields:**

- **id**: BIGINT, PK, AUTO_INCREMENT
  - Khóa chính nội bộ
  - Dùng cho joins và references
  
- **project_id**: BIGINT, FK → projects(id), NOT NULL
  - Task thuộc project nào
  - ON DELETE CASCADE (xóa project → xóa tasks)
  - **KHÔNG BAO GIỜ NULL** - task must belong to a project
  
- **task_number**: INT, NOT NULL
  - Số thứ tự trong project
  - VD: Project "PROJ" → PROJ-1, PROJ-2, PROJ-3...
  - Auto-increment per project (không phải global)
  - UNIQUE trong scope của project

**Display ID = project.key + task_number**
```
Task display: PROJ-123
- project.key = "PROJ"  
- task.task_number = 123
```

**Content Fields:**

- **title**: VARCHAR(500), NOT NULL
  - Tiêu đề ngắn gọn, mô tả task
  - VD: "Fix login button not working on Safari"
  - Required, không được empty
  - Index for search
  
- **description**: TEXT, NULLABLE
  - Mô tả chi tiết, requirements
  - Markdown support
  - Có thể rất dài
  - VD: Steps to reproduce, acceptance criteria, technical notes
  
**Classification Fields:**

- **type**: ENUM('task', 'bug', 'story', 'epic', 'subtask'), NOT NULL
  - **task**: Công việc thông thường
  - **bug**: Lỗi cần fix
  - **story**: User story (Agile)
  - **epic**: Task lớn, chia nhỏ thành nhiều tasks
  - **subtask**: Task con của task khác
  - Default: 'task'
  
- **status**: ENUM, NOT NULL
  - Tuỳ project có thể custom
  - Default workflow: 'backlog' → 'todo' → 'in_progress' → 'in_review' → 'done' → 'closed'
  - Có thể có thêm: 'blocked', 'testing', 'deployment'
  - Default: 'backlog'
  
- **priority**: ENUM('lowest', 'low', 'medium', 'high', 'highest'), NOT NULL
  - Độ ưu tiên
  - Ảnh hưởng đến ordering và assignment
  - Default: 'medium'

**🔥 OWNERSHIP FIELDS - THEN CHỐT CHO PHÂN QUYỀN:**

- **reporter_id**: BIGINT, FK → users(id), NOT NULL
  - **Người TẠO task**
  - Có thể là: PM, Dev, Tester, Client...
  - **KHÔNG thể NULL** - must know who created it
  - **Immutable trong nhiều trường hợp** - không nên thay đổi reporter
  - ON DELETE RESTRICT (không xóa được user nếu còn là reporter của tasks active)
  
  **Quyền của Reporter:**
  - ✅ Edit task details (title, description, priority)
  - ✅ Delete task (nếu là Member/Admin)
  - ✅ Reassign task
  - ✅ Comment
  - ✅ Update status (trong một số trường hợp)
  
- **assignee_id**: BIGINT, FK → users(id), NULLABLE
  - **Người ĐƯỢC GIAO task**
  - Có thể NULL = task chưa assign (trong backlog)
  - Có thể reassign sang người khác
  - ON DELETE SET NULL (nếu user bị xóa → task trở về unassigned)
  
  **Quyền của Assignee:**
  - ✅ Edit task details
  - ✅ Update status (chính họ làm nên họ biết progress)
  - ✅ Update actual_hours
  - ✅ Comment
  - ❌ KHÔNG delete được (chỉ reporter mới delete được)

**⚠️ QUAN TRỌNG: Reporter vs Assignee**

**Case 1: Reporter = Assignee**
```
Dev tự tạo task cho mình:
- reporter_id = Dev A
- assignee_id = Dev A
→ Dev A có FULL quyền
```

**Case 2: Reporter ≠ Assignee**
```
PM tạo task cho Dev:
- reporter_id = PM
- assignee_id = Dev B
→ PM có quyền delete
→ Dev B có quyền update status
→ Cả 2 đều edit được
```

**Case 3: Assignee = NULL**
```
Task trong backlog:
- reporter_id = PM
- assignee_id = NULL
→ Chỉ PM và Admin edit được
→ Members có thể self-assign
```

**Timeline Fields:**

- **due_date**: DATE, NULLABLE
  - Deadline của task
  - Không enforce hard (có thể làm muộn)
  - Dùng cho prioritization và reports
  
- **estimated_hours**: DECIMAL(5,2), NULLABLE
  - Estimate ban đầu: bao nhiêu giờ để hoàn thành
  - VD: 8.5 giờ
  - Dùng cho planning và capacity
  
- **actual_hours**: DECIMAL(5,2), NULLABLE
  - Thực tế đã làm bao nhiêu giờ
  - Assignee tự update
  - Dùng cho time tracking và velocity

**Relationship Fields:**

- **parent_task_id**: BIGINT, FK → tasks(id), NULLABLE
  - Task cha (nếu đây là subtask)
  - Self-referencing foreign key
  - NULL = task độc lập
  - Tree structure: Parent → Children
  - ON DELETE CASCADE (xóa parent → xóa children)
  
- **sprint_id**: BIGINT, FK → sprints(id), NULLABLE
  - Task thuộc sprint nào
  - NULL = chưa plan vào sprint (backlog)
  - ON DELETE SET NULL (xóa sprint → tasks về backlog)

**Indexes QUAN TRỌNG:**
```sql
-- Performance cho queries thường dùng
INDEX idx_project ON tasks(project_id)
INDEX idx_reporter ON tasks(reporter_id)  -- "Tasks I created"
INDEX idx_assignee ON tasks(assignee_id)  -- "Tasks assigned to me"
INDEX idx_status ON tasks(project_id, status)  -- Kanban board
INDEX idx_sprint ON tasks(sprint_id)  -- Sprint backlog
INDEX idx_type ON tasks(project_id, type)  -- Filter by type
INDEX idx_priority ON tasks(project_id, priority, status)  -- Sort by priority

-- Composite index cho ownership check
INDEX idx_ownership ON tasks(project_id, reporter_id, assignee_id)

-- Full-text search
FULLTEXT INDEX idx_search ON tasks(title, description)
```

**Virtual Column (nếu support):**
```sql
-- Display ID tự động
display_id AS CONCAT(
  (SELECT key FROM projects WHERE id = project_id),
  '-',
  task_number
) VIRTUAL
```

---

### 3.2. Table `task_history`

**Mục đích**: Audit log - Theo dõi MỌI thay đổi trên tasks

**Tại sao cần**: 
1. Compliance: Ai làm gì, khi nào
2. Debugging: Tại sao task này lại ở trạng thái này?
3. Undo/Revert: Khôi phục về version cũ
4. Analytics: Tracking workflow efficiency

```
task_history
├── id (PK)
├── task_id (FK → tasks)
├── changed_by (FK → users)    # Ai thay đổi
├── changed_at                 # Khi nào
├── field_name                 # Field nào đổi
├── old_value                  # Giá trị cũ
├── new_value                  # Giá trị mới
├── change_type                # created/updated/deleted
└── ip_address                 # IP của user (security)
```

**Chi tiết:**

- **task_id**: BIGINT, FK, NOT NULL
  - Task nào bị thay đổi
  - ON DELETE CASCADE
  
- **changed_by**: BIGINT, FK → users(id), NOT NULL
  - User thực hiện thay đổi
  - KHÔNG thể NULL (must know who)
  - ON DELETE SET NULL hoặc RESTRICT tùy policy
  
- **changed_at**: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - Timestamp chính xác
  - Include timezone
  
- **field_name**: VARCHAR(50), NOT NULL
  - Tên field bị đổi
  - VD: 'status', 'assignee_id', 'title', 'priority'
  - Null nếu change_type = 'created'
  
- **old_value**, **new_value**: TEXT, NULLABLE
  - Giá trị trước và sau
  - Store as TEXT để flexible (có thể là JSON)
  - VD: old='todo', new='in_progress'
  
- **change_type**: ENUM('created', 'updated', 'deleted', 'commented'), NOT NULL
  - Loại thay đổi
  
- **ip_address**: VARCHAR(45), NULLABLE
  - IPv4 hoặc IPv6
  - Security audit

**Indexes:**
```sql
INDEX idx_task ON task_history(task_id, changed_at DESC)  -- Task timeline
INDEX idx_user ON task_history(changed_by)  -- User activity
INDEX idx_date ON task_history(changed_at)  -- Date range queries
```

**Use cases:**

**UC1: Task timeline/activity**
```sql
-- Xem lịch sử thay đổi của task
SELECT h.*, u.username
FROM task_history h
JOIN users u ON h.changed_by = u.id
WHERE h.task_id = ?
ORDER BY h.changed_at DESC
```

**UC2: User activity report**
```sql
-- Admin xem user này làm gì trong project
SELECT COUNT(*) as changes, DATE(changed_at) as date
FROM task_history
WHERE changed_by = ? 
  AND changed_at > NOW() - INTERVAL 7 DAY
GROUP BY DATE(changed_at)
```

**UC3: Revert changes**
```sql
-- Rollback task về trạng thái trước đó
-- (Application logic, không phải SQL trực tiếp)
```

---

### 3.3. Table `comments`

**Mục đích**: Communication và collaboration trên tasks

```
comments
├── id (PK)
├── task_id (FK → tasks)
├── user_id (FK → users)       # Ai comment
├── content                    # Nội dung
├── parent_comment_id (FK)     # Reply to comment
├── mentions                   # Array of user_ids được @mention
├── is_edited                  # Đã sửa chưa
├── created_at
└── updated_at
```

**Chi tiết:**

- **task_id**: BIGINT, FK, NOT NULL
  - Comment trên task nào
  
- **user_id**: BIGINT, FK, NOT NULL
  - Ai viết comment
  - ON DELETE SET NULL (giữ comment, mark as "Deleted User")
  
- **content**: TEXT, NOT NULL
  - Nội dung comment
  - Markdown support
  - Có thể chứa @mentions
  
- **parent_comment_id**: BIGINT, FK → comments(id), NULLABLE
  - Reply to another comment
  - NULL = top-level comment
  - Tạo thread discussion
  
- **mentions**: JSON hoặc separate table, NULLABLE
  - Danh sách user_ids được @mention
  - VD: [123, 456, 789]
  - Dùng để gửi notifications
  
- **is_edited**: BOOLEAN, DEFAULT FALSE
  - Đánh dấu comment đã edit
  - Transparency: người đọc biết comment đã sửa

**Indexes:**
```sql
INDEX idx_task ON comments(task_id, created_at)
INDEX idx_user ON comments(user_id)
INDEX idx_parent ON comments(parent_comment_id)
```

**Permission rules:**

| Role | Create | Edit own | Delete own | View |
|------|--------|----------|------------|------|
| Viewer | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ (any) | ✅ |

→ **Mọi role đều comment được** (kể cả Viewer)

---

## 4. NHÓM TABLES: SPRINTS & PLANNING

### 4.1. Table `sprints`

**Mục đích**: Quản lý sprints (Agile/Scrum methodology)

```
sprints
├── id (PK)
├── project_id (FK → projects)
├── name                       # Sprint 1, Sprint 2...
├── goal                       # Mục tiêu sprint
├── start_date                 # Ngày bắt đầu
├── end_date                   # Ngày kết thúc
├── status                     # planned/active/completed
├── created_at
└── updated_at
```

**Chi tiết:**

- **name**: VARCHAR(100), NOT NULL
  - VD: "Sprint 1", "Q1 2025 Sprint 3"
  
- **goal**: TEXT
  - Sprint goal (Scrum)
  - VD: "Complete user authentication module"
  
- **start_date**, **end_date**: DATE, NOT NULL
  - Thời gian sprint (thường 1-4 tuần)
  - Không overlap sprints
  
- **status**: ENUM('planned', 'active', 'completed'), NOT NULL
  - **planned**: Chưa bắt đầu
  - **active**: Đang chạy (chỉ có 1 active sprint/project)
  - **completed**: Đã kết thúc

**Permission rules:**
- Viewer: ❌ Không tạo/sửa sprints
- Member: ❌ Không tạo/sửa sprints (chỉ PM/Admin)
- Admin: ✅ Full control

**Use case:**
```sql
-- Xem tasks trong sprint hiện tại
SELECT t.*
FROM tasks t
JOIN sprints s ON t.sprint_id = s.id
WHERE s.project_id = ? AND s.status = 'active'
```

---

## 5. NHÓM TABLES: ATTACHMENTS & LABELS

### 5.1. Table `attachments`

**Mục đích**: Quản lý files đính kèm vào tasks

```
attachments
├── id (PK)
├── task_id (FK → tasks)
├── uploaded_by (FK → users)
├── filename                   # Tên file gốc
├── file_size                  # Bytes
├── mime_type                  # image/png, application/pdf...
├── storage_path               # Path trên storage
├── thumbnail_path             # Thumbnail cho images
├── created_at
└── updated_at
```

**Permission rules:**
- Viewer: ❌ Không upload
- Member: ✅ Upload vào own tasks
- Admin: ✅ Upload vào any task

---

### 5.2. Table `labels`

**Mục đích**: Tags/labels để categorize tasks

```
labels
├── id (PK)
├── project_id (FK → projects)
├── name                       # frontend, backend, urgent...
├── color                      # Hex color code
├── description
├── created_by (FK → users)
├── created_at
└── updated_at
```

### 5.3. Table `task_labels` (Join table)

```
task_labels
├── task_id (FK → tasks)
├── label_id (FK → labels)
└── created_at

UNIQUE KEY (task_id, label_id)
```

**Permission rules:**
- Viewer: ❌ Không tạo labels
- Member: ✅ Tạo labels, add labels vào own tasks
- Admin: ✅ Full control, có thể delete labels

---

## 6. PERMISSION CHECK LOGIC

### 6.1. Pseudo-code cho permission check

```javascript
function canUserEditTask(userId, taskId) {
  // 1. Get user's role in project
  const membership = await db.query(`
    SELECT pm.role 
    FROM project_members pm
    JOIN tasks t ON pm.project_id = t.project_id
    WHERE pm.user_id = ? AND t.id = ?
  `, [userId, taskId]);
  
  if (!membership) return false; // User không thuộc project
  
  // 2. Admin always can
  if (membership.role === 'admin') return true;
  
  // 3. Viewer never can (except comments)
  if (membership.role === 'viewer') return false;
  
  // 4. Member: check ownership
  if (membership.role === 'member') {
    const task = await db.query(`
      SELECT reporter_id, assignee_id
      FROM tasks
      WHERE id = ?
    `, [taskId]);
    
    // Can edit if user is reporter OR assignee
    return task.reporter_id === userId || task.assignee_id === userId;
  }
  
  return false;
}

function canUserDeleteTask(userId, taskId) {
  // Tương tự canUserEditTask nhưng:
  // - Admin: YES
  // - Member: YES nếu là REPORTER (không phải assignee)
  // - Viewer: NO
  
  const membership = await getMembership(userId, taskId);
  if (!membership) return false;
  
  if (membership.role === 'admin') return true;
  if (membership.role === 'viewer') return false;
  
  if (membership.role === 'member') {
    const task = await getTask(taskId);
    return task.reporter_id === userId; // Chỉ reporter mới delete
  }
  
  return false;
}

function canUserReassignTask(userId, taskId) {
  // - Admin: YES, reassign bất kỳ task nào
  // - Member: YES nếu là reporter (reassign task mình tạo)
  // - Member: YES nếu task assigned cho mình (reassign cho người khác)
  // - Viewer: NO
  
  const membership = await getMembership(userId, taskId);
  if (membership.role === 'admin') return true;
  if (membership.role === 'viewer') return false;
  
  if (membership.role === 'member') {
    const task = await getTask(taskId);
    return task.reporter_id === userId || task.assignee_id === userId;
  }
  
  return false;
}
```

---

## 7. QUERIES QUAN TRỌNG

### 7.1. List tasks user có thể edit

```sql
-- Tasks mà user này có quyền edit
SELECT DISTINCT t.*,
  p.key as project_key,
  CONCAT(p.key, '-', t.task_number) as display_id,
  reporter.username as reporter_name,
  assignee.username as assignee_name
FROM tasks t
JOIN projects p ON t.project_id = p.id
JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN users reporter ON t.reporter_id = reporter.id
LEFT JOIN users assignee ON t.assignee_id = assignee.id
WHERE pm.user_id = ?  -- Current user
  AND pm.status = 'active'
  AND (
    pm.role = 'admin'  -- Admin sees all
    OR (pm.role = 'member' AND (t.reporter_id = ? OR t.assignee_id = ?))  -- Member sees own
  )
ORDER BY t.created_at DESC
```

### 7.2. Count tasks by status (for Kanban)

```sql
-- Kanban board của project
SELECT 
  t.status,
  COUNT(*) as task_count,
  COUNT(CASE WHEN pm.user_id = ? THEN 1 END) as my_task_count
FROM tasks t
JOIN project_members pm ON t.project_id = pm.project_id
WHERE t.project_id = ?
  AND pm.user_id = ?
  AND pm.status = 'active'
GROUP BY t.status
ORDER BY 
  FIELD(t.status, 'backlog', 'todo', 'in_progress', 'in_review', 'done')
```

### 7.3. My tasks (assigned to me)

```sql
-- Tasks assigned to current user across all projects
SELECT 
  t.*,
  p.name as project_name,
  p.key as project_key,
  CONCAT(p.key, '-', t.task_number) as display_id,
  pm.role as my_role
FROM tasks t
JOIN projects p ON t.project_id = p.id
JOIN project_members pm ON p.id = pm.project_id
WHERE t.assignee_id = ?  -- Current user
  AND pm.user_id = ?
  AND pm.status = 'active'
  AND t.status NOT IN ('done', 'closed')
ORDER BY 
  t.priority DESC,
  t.due_date ASC NULLS LAST
```

### 7.4. Tasks I created (reporter)

```sql
-- Tasks created by me
SELECT 
  t.*,
  p.name as project_name,
  CONCAT(p.key, '-', t.task_number) as display_id,
  assignee.username as assignee_name,
  assignee.avatar_url as assignee_avatar
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN users assignee ON t.assignee_id = assignee.id
WHERE t.reporter_id = ?  -- Current user
ORDER BY t.created_at DESC
LIMIT 50
```

### 7.5. Check if user can edit specific task

```sql
-- Permission check query (single task)
SELECT 
  CASE
    WHEN pm.role = 'admin' THEN TRUE
    WHEN pm.role = 'viewer' THEN FALSE
    WHEN pm.role = 'member' AND (t.reporter_id = ? OR t.assignee_id = ?) THEN TRUE
    ELSE FALSE
  END as can_edit
FROM tasks t
JOIN project_members pm ON t.project_id = pm.project_id
WHERE t.id = ?  -- Task ID
  AND pm.user_id = ?  -- User ID
  AND pm.status = 'active'
```

---

## 8. ĐẶC ĐIỂM QUAN TRỌNG CỦA KIẾN TRÚC

### 8.1. Separation of Role and Ownership

**Role (project_members.role)**:
- Áp dụng cho TẤT CẢ resources trong project
- Quyền ở cấp độ project
- VD: Admin có quyền với mọi tasks

**Ownership (tasks.reporter_id, tasks.assignee_id)**:
- Áp dụng cho TỪNG task cụ thể
- Quyền ở cấp độ resource
- VD: Member chỉ edit được own tasks

**Kết hợp cả 2:**
```
User có quyền edit task nếu:
  (role = 'admin') 
  OR 
  (role = 'member' AND (reporter_id = user OR assignee_id = user))
```

---

### 8.2. Flexibility: Multiple projects, multiple roles

```
User A:
- Project X: Admin
- Project Y: Member
- Project Z: Viewer

→ Cần check role PER PROJECT
```

**Query pattern:**
```sql
-- ĐÚNG: Check role trong specific project
SELECT role FROM project_members
WHERE user_id = ? AND project_id = ?

-- SAI: Check global role (không tồn tại)
SELECT role FROM users WHERE id = ?  -- ❌ Wrong!
```

---

### 8.3. Audit Trail với task_history

**Mọi thay đổi đều tracked:**
- Ai (changed_by)
- Cái gì (field_name)
- Từ đâu (old_value)
- Đến đâu (new_value)
- Khi nào (changed_at)
- Từ đâu (ip_address)

**Benefits:**
1. Compliance
2. Debugging
3. Analytics
4. Security investigation
5. Undo/Rollback capability

---

### 8.4. Scalability considerations

**Indexes đầy đủ:**
- Mọi foreign keys đều có index
- Composite indexes cho queries phổ biến
- Fulltext index cho search

**Partitioning (nếu cần):**
```sql
-- Partition task_history by month
PARTITION BY RANGE (YEAR(changed_at) * 100 + MONTH(changed_at))
```

**Archiving:**
- Projects completed có thể archive
- Tasks cũ có thể move sang cold storage
- History giữ lại nhưng partition riêng

---

## 9. MỞ RỘNG TƯƠNG LAI

### 9.1. Custom workflows

**Table: workflow_statuses**
```
workflow_statuses
├── id
├── project_id
├── status_name
├── status_order
├── status_category (todo/in_progress/done)
└── is_default
```

→ Mỗi project tự define statuses của mình

---

### 9.2. Fine-grained permissions

**Table: custom_permissions**
```
custom_permissions
├── id
├── project_id
├── role
├── resource_type (task/comment/attachment)
├── action (create/read/update/delete)
├── is_allowed
└── conditions (JSON)
```

VD:
```json
{
  "project_id": 123,
  "role": "member",
  "resource_type": "task",
  "action": "delete",
  "is_allowed": true,
  "conditions": {
    "only_if": "reporter_id = current_user AND status = 'backlog'"
  }
}
```

---

### 9.3. Teams/Groups

**Table: teams**
```
teams
├── id
├── project_id
├── name (Frontend Team, Backend Team)
└── description
```

**Table: team_members**
```
team_members
├── team_id
├── user_id
└── role (lead/member)
```

**Usage:**
- Assign tasks to teams thay vì individuals
- Filter tasks by team
- Team-based reports

---

### 9.4. Notifications

**Table: notifications**
```
notifications
├── id
├── user_id
├── type (task_assigned/comment_mentioned/status_changed)
├── entity_type (task/comment)
├── entity_id
├── message
├── is_read
├── created_at
```

**Triggers:**
- Task assigned → notify assignee
- @mention in comment → notify mentioned users
- Status changed → notify watchers
- Due date approaching → notify assignee

---

## 10. TÓM TẮT KIẾN TRÚC

### Core Tables (Must-have):
1. ✅ **users** - Authentication & user info
2. ✅ **projects** - Project management
3. ✅ **project_members** - Role assignment (QUAN TRỌNG NHẤT)
4. ✅ **tasks** - Core work items với reporter_id + assignee_id
5. ✅ **task_history** - Audit trail
6. ✅ **comments** - Communication

### Supporting Tables:
7. ✅ **sprints** - Agile planning
8. ✅ **attachments** - File management
9. ✅ **labels** + **task_labels** - Categorization

### Permission Model:

**3-Level Roles:**
```
VIEWER  → Read-only + comments
MEMBER  → Own tasks management
ADMIN   → Full control
```

**Ownership Model:**
```
Reporter → Người tạo task (có quyền delete)
Assignee → Người làm task (có quyền update status)
Both     → Cả 2 đều có quyền edit
```

**Check Permission:**
```
Can edit task = (role = admin) 
                OR 
                (role = member AND (is_reporter OR is_assignee))
```

---

## KẾT LUẬN

Kiến trúc này:

✅ **Đáp ứng đầy đủ yêu cầu 3-level roles**
✅ **Implement ownership principle** (reporter vs assignee)
✅ **Flexible** (1 user nhiều projects, mỗi project khác role)
✅ **Auditable** (task_history tracking everything)
✅ **Scalable** (indexes, partitioning ready)
✅ **Maintainable** (clear separation of concerns)

**Next steps:**
1. Review kiến trúc này với team
2. Adjust nếu cần based on feedback
3. Implement database schema
4. Write migration scripts
5. Build API layer với permission middleware
6. Write comprehensive tests

Bạn có câu hỏi gì về kiến trúc này không? 🚀
