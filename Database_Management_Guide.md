# 🛠️ Supabase Development & Query Guide

This guide explains how to manage your data, modify queries, and update your database structure as your application grows.

## 1. Changing Queries (Code)
All data-fetching logic is located in the `/lib` and `/app` directories using the Supabase JavaScript Client.

### **Selecting Data**
To change what data you fetch, modify the `.select()` parameters.
```typescript
// Old query
const { data } = await supabase.from('profiles').select('id, full_name')

// New query (Adding more columns)
const { data } = await supabase.from('profiles').select('id, full_name, student_id, role')
```

### **Filtering Data**
Use `.eq()` (equal), `.in()` (in array), or `.order()` (sorting).
```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

---

## 2. Modifying Tables (Supabase Dashboard)
To add a new column or change a data type:

1.  **Go to Table Editor**: In your Supabase Dashboard, select **Table Editor** (grid icon).
2.  **Select Table**: Click on the table you want to change (e.g., `profiles`).
3.  **Insert Column**: Click **"+"** at the end of the headers or **Insert Column**.
4.  **Choose Type**: Set the name (e.g., `phone`) and type (e.g., `text`).
5.  **Save**: Click **Save**.

---

## 3. Advanced Migrations (SQL Editor)
For complex changes that need to happen at once, use the **SQL Editor** (terminal icon).

### **Example: Renaming a Column**
```sql
ALTER TABLE public.profiles RENAME COLUMN old_name TO new_name;
```

### **Example: Adding a Constraint**
```sql
ALTER TABLE public.profiles ADD CONSTRAINT unique_student_id UNIQUE (student_id);
```

---

## 4. Permission Management (RLS)
Whenever you add a table, you **MUST** enable Row Level Security (RLS) to keep user data private.

1.  Go to **Authentication > Policies**.
2.  Select your table and click **New Policy**.
3.  **Template**: Select "Enable read access for users based on user_id".
4.  This ensures that user A cannot see user B's data!

---

> [!NOTE]
> **Typescript Tip**: If you change the database schema, make sure to update the interfaces in `types/database.ts` so your IDE doesn't show errors.
