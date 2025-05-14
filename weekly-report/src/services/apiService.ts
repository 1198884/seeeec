import axios from 'axios';

export interface WeeklyReport {
  id?: number;
  username: string;
  weekStart: string;
  weekEnd: string;
  accomplishments: string;
  challenges: string;
  nextWeekPlan: string;
  submittedDate?: string;
}

// 模拟本地存储API，不需要后端
const LOCAL_STORAGE_KEY = 'weekly-reports';

// 初始化本地存储
const initializeStorage = (): WeeklyReport[] => {
  const existingData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!existingData) {
    const initialData: WeeklyReport[] = [
      {
        id: 1,
        username: 'demo_user',
        weekStart: '2024-06-01',
        weekEnd: '2024-06-07',
        accomplishments: '完成了前端页面设计',
        challenges: '解决了响应式布局问题',
        nextWeekPlan: '开始实现后端API集成',
        submittedDate: '2024-06-07'
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(existingData);
};

// 保存数据到本地存储
const saveData = (data: WeeklyReport[]): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

// 获取下一个可用ID
const getNextId = (reports: WeeklyReport[]): number => {
  if (reports.length === 0) return 1;
  return Math.max(...reports.map(r => r.id || 0)) + 1;
};

export const apiService = {
  getAllReports: async (): Promise<WeeklyReport[]> => {
    const data = initializeStorage();
    return new Promise(resolve => {
      setTimeout(() => resolve(data), 300); // 模拟网络延迟
    });
  },

  getReportById: async (id: number): Promise<WeeklyReport> => {
    const data = initializeStorage();
    const report = data.find(r => r.id === id);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (report) {
          resolve(report);
        } else {
          reject(new Error('Report not found'));
        }
      }, 300);
    });
  },

  getReportsByUsername: async (username: string): Promise<WeeklyReport[]> => {
    const data = initializeStorage();
    const reports = data.filter(r => r.username === username);
    
    return new Promise(resolve => {
      setTimeout(() => resolve(reports), 300);
    });
  },

  getReportsByDateRange: async (startDate: string, endDate: string): Promise<WeeklyReport[]> => {
    const data = initializeStorage();
    const reports = data.filter(r => 
      r.weekStart >= startDate && r.weekEnd <= endDate
    );
    
    return new Promise(resolve => {
      setTimeout(() => resolve(reports), 300);
    });
  },

  getReportsByUsernameAndDateRange: async (
    username: string, 
    startDate: string, 
    endDate: string
  ): Promise<WeeklyReport[]> => {
    const data = initializeStorage();
    const reports = data.filter(r => 
      r.username === username && r.weekStart >= startDate && r.weekEnd <= endDate
    );
    
    return new Promise(resolve => {
      setTimeout(() => resolve(reports), 300);
    });
  },

  createReport: async (report: WeeklyReport): Promise<WeeklyReport> => {
    const data = initializeStorage();
    const newReport = {
      ...report,
      id: getNextId(data),
      submittedDate: report.submittedDate || new Date().toISOString().split('T')[0]
    };
    
    data.push(newReport);
    saveData(data);
    
    return new Promise(resolve => {
      setTimeout(() => resolve(newReport), 300);
    });
  },

  updateReport: async (id: number, report: WeeklyReport): Promise<WeeklyReport> => {
    const data = initializeStorage();
    const index = data.findIndex(r => r.id === id);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (index !== -1) {
          const updatedReport = {
            ...report,
            id,
            submittedDate: new Date().toISOString().split('T')[0]
          };
          data[index] = updatedReport;
          saveData(data);
          resolve(updatedReport);
        } else {
          reject(new Error('Report not found'));
        }
      }, 300);
    });
  },

  deleteReport: async (id: number): Promise<void> => {
    const data = initializeStorage();
    const index = data.findIndex(r => r.id === id);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (index !== -1) {
          data.splice(index, 1);
          saveData(data);
          resolve();
        } else {
          reject(new Error('Report not found'));
        }
      }, 300);
    });
  }
}; 