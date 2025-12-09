export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  pinecone_id: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  generated_text: string;
  source_task_ids: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  work_hours: string | null;
  focus_style: string | null;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];