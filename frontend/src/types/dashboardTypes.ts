export interface ProtectedData {
    message: string;
    userid: number;
    is_sudo: boolean;
    profile_pic?: string;
    username: string;
  }
  
  export interface ProjectData {
    days_elapsed: number;
    planned_progress: number;
    actual_progress: number;
  }
  
  export interface RecentImport {
    prediction: string;
    chart_data: ProjectData[];
    created_at: string;
  }
  