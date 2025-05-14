import { defineStore } from 'pinia'

// 定义权限类型
export const Permission = {
  VIEW_REPORT: 'view_report',  // 查看周报
  EDIT_REPORT: 'edit_report',  // 编辑周报
  DELETE_REPORT: 'delete_report',  // 删除周报
  CREATE_REPORT: 'create_report',  // 创建周报
  MANAGE_USERS: 'manage_users'  // 管理用户
} as const

export type Permission = typeof Permission[keyof typeof Permission]

// 定义角色权限映射
const rolePermissions = {
  admin: [
    Permission.VIEW_REPORT,
    Permission.EDIT_REPORT,
    Permission.DELETE_REPORT,
    Permission.CREATE_REPORT,
    Permission.MANAGE_USERS
  ],
  user: [
    Permission.VIEW_REPORT  // 只保留查看权限
  ],
  viewer: [
    Permission.VIEW_REPORT
  ]
}

// Mock users data
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: '管理员',
    role: 'admin',
    avatar: '',
    permissions: rolePermissions.admin
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    name: '普通用户',
    role: 'user',
    avatar: '',
    permissions: rolePermissions.user
  },
  {
    id: 3,
    username: 'viewer',
    password: 'viewer123',
    name: '只读用户',
    role: 'viewer',
    avatar: '',
    permissions: rolePermissions.viewer
  }
]

// Interface for user data
interface User {
  id: number
  username: string
  name: string
  role: string
  avatar: string
  permissions: Permission[]
}

interface UserWithPassword extends User {
  password: string
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  users: UserWithPassword[]
}

// 从localStorage加载数据并确保权限正确
const loadUserFromStorage = (): User | null => {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) return null
  
  try {
    const user = JSON.parse(savedUser)
    // 增加类型检查
    if (!user || typeof user !== 'object') {
      throw new Error('Invalid user data format')
    }
    
    // 验证必要字段
    if (!user.id || !user.username || !user.role) {
      throw new Error('Missing required user fields')
    }
    
    // 确保权限是正确的字符串数组
    if (user.role && rolePermissions[user.role as keyof typeof rolePermissions]) {
      user.permissions = rolePermissions[user.role as keyof typeof rolePermissions]
    } else {
      throw new Error('Invalid user role')
    }
    
    return user as User
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e)
    localStorage.removeItem('user')
    return null
  }
}

// Define auth store
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    // 使用安全的加载方法
    const user = loadUserFromStorage()
    
    // Get users from localStorage or use default
    let initialUsers: UserWithPassword[] = []
    try {
      const savedUsers = localStorage.getItem('users')
      initialUsers = savedUsers ? JSON.parse(savedUsers) : users
      
      // 确保所有用户的权限都是正确的
      initialUsers = initialUsers.map(user => {
        if (user.role && rolePermissions[user.role as keyof typeof rolePermissions]) {
          return {
            ...user,
            permissions: rolePermissions[user.role as keyof typeof rolePermissions]
          }
        }
        return user
      })
    } catch (e) {
      console.error('Failed to parse users from localStorage', e)
      initialUsers = users
    }
    
    return {
      user,
      isLoggedIn: !!user,
      users: initialUsers
    }
  },
  
  actions: {
    // Login action
    login(username: string, password: string): boolean {
      // Find user with matching credentials
      const user = this.users.find(
        u => u.username === username && u.password === password
      )
      
      if (user) {
        // 确保权限是最新的
        const permissions = rolePermissions[user.role as keyof typeof rolePermissions] || []
        
        // Create a safe user object without the password
        const safeUser = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          permissions // 使用角色对应的权限列表
        }
        
        // Save user data to state and localStorage
        this.user = safeUser
        this.isLoggedIn = true
        localStorage.setItem('user', JSON.stringify(safeUser))
        
        return true
      }
      
      return false
    },
    
    // Logout action
    logout(): void {
      // Clear state and localStorage
      this.user = null
      this.isLoggedIn = false
      localStorage.removeItem('user')
    },
    
    // Check if user is authenticated
    isAuthenticated(): boolean {
      // 如果用户已经登录但数据可能有问题，尝试重新加载用户数据
      if (this.isLoggedIn && !this.user?.permissions?.length) {
        const user = loadUserFromStorage()
        if (user) {
          this.user = user
        } else {
          this.isLoggedIn = false
          return false
        }
      }
      return this.isLoggedIn && !!this.user
    },
    
    // Get current user data
    getCurrentUser(): User | null {
      return this.user
    },
    
    // Get all users (for admin use)
    getAllUsers(): User[] {
      // Return users without passwords
      return this.users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
        permissions: u.permissions
      }))
    },
    
    // Check if user has specific permission
    hasPermission(permission: Permission): boolean {
      try {
        if (!this.isAuthenticated()) return false;
        if (!this.user?.permissions || !Array.isArray(this.user.permissions)) return false;
        if (!permission || typeof permission !== 'string') return false;
        
        // 验证权限是否为有效的Permission类型
        if (!Object.values(Permission).includes(permission)) {
          console.warn(`Invalid permission type: ${permission}`);
          return false;
        }
        
        return this.user.permissions.includes(permission);
      } catch (error) {
        console.error('Permission check failed:', error);
        return false;
      }
    },
    
    // Check if user has any of the permissions
    hasAnyPermission(permissions: Permission[]): boolean {
      try {
        if (!this.isAuthenticated()) return false;
        if (!Array.isArray(permissions)) {
          console.warn('Permissions parameter must be an array');
          return false;
        }
        
        // 过滤无效的权限
        const validPermissions = permissions.filter(p => 
          Object.values(Permission).includes(p)
        );
        
        if (validPermissions.length === 0) return true;
        
        return validPermissions.some(permission => 
          this.hasPermission(permission)
        );
      } catch (error) {
        console.error('Permission check failed:', error);
        return false;
      }
    },
    
    // Check if user has all of the permissions
    hasAllPermissions(permissions: Permission[]): boolean {
      if (!this.user || !this.user.permissions) return false;
      
      // 确保permissions参数是数组
      const permissionsToCheck = Array.isArray(permissions) ? permissions : [];
      if (permissionsToCheck.length === 0) return true; // 如果没有指定权限，则认为有权限
      
      return permissionsToCheck.every(permission => 
        this.user?.permissions?.includes(permission)
      );
    },
    
    // Add a new user
    addUser(newUser: Omit<UserWithPassword, 'id' | 'permissions'>): boolean {
      // Check if username already exists
      if (this.users.some(u => u.username === newUser.username)) {
        return false
      }
      
      // Generate a new ID
      const newId = Math.max(...this.users.map(u => u.id), 0) + 1
      
      // Get permissions for the role
      const permissions = rolePermissions[newUser.role as keyof typeof rolePermissions] || []
      
      // Add user to store
      const userToAdd: UserWithPassword = {
        id: newId,
        username: newUser.username,
        name: newUser.name,
        password: newUser.password,
        role: newUser.role,
        avatar: newUser.avatar || '',
        permissions
      }
      
      this.users.push(userToAdd)
      
      // Save updated users to localStorage
      localStorage.setItem('users', JSON.stringify(this.users))
      
      return true
    },
    
    // Update user permissions
    updateUserPermissions(userId: number, permissions: Permission[]): boolean {
      const userIndex = this.users.findIndex(u => u.id === userId)
      
      if (userIndex >= 0) {
        // 确保权限是有效的
        const validPermissions = permissions.filter(p => 
          Object.values(Permission).includes(p as any)
        )
        
        // Update permissions
        this.users[userIndex] = {
          ...this.users[userIndex],
          permissions: validPermissions
        }
        
        // Update current user if it's the same user
        if (this.user && this.user.id === userId) {
          this.user = {
            ...this.user,
            permissions: validPermissions
          }
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        
        // Save updated users to localStorage
        localStorage.setItem('users', JSON.stringify(this.users))
        return true
      }
      
      return false
    },
    
    // Delete a user
    deleteUser(userId: number): boolean {
      // Cannot delete your own account
      if (this.user && userId === this.user.id) {
        return false
      }
      
      const initialLength = this.users.length
      this.users = this.users.filter(u => u.id !== userId)
      
      // If user was deleted
      if (this.users.length < initialLength) {
        // Save updated users to localStorage
        localStorage.setItem('users', JSON.stringify(this.users))
        return true
      }
      
      return false
    },
    
    // Update user password
    updatePassword(userId: number, currentPassword: string, newPassword: string): boolean {
      const userIndex = this.users.findIndex(u => u.id === userId)
      
      if (userIndex >= 0) {
        const user = this.users[userIndex]
        
        // Verify current password
        if (user.password === currentPassword) {
          // 确保更新密码后权限不丢失
          const role = user.role as keyof typeof rolePermissions
          const permissions = rolePermissions[role] || user.permissions
          
          // Update password
          this.users[userIndex] = {
            ...user,
            password: newPassword,
            permissions
          }
          
          // Save updated users to localStorage
          localStorage.setItem('users', JSON.stringify(this.users))
          return true
        }
      }
      
      return false
    },
    
    // 重置所有用户的权限为其角色默认权限
    resetPermissions(): void {
      // 重置所有用户的权限
      this.users = this.users.map(user => {
        const role = user.role as keyof typeof rolePermissions
        return {
          ...user,
          permissions: rolePermissions[role] || []
        }
      })
      
      // 重置当前用户权限
      if (this.user) {
        const role = this.user.role as keyof typeof rolePermissions
        this.user = {
          ...this.user,
          permissions: rolePermissions[role] || []
        }
        localStorage.setItem('user', JSON.stringify(this.user))
      }
      
      // 保存更新后的用户到localStorage
      localStorage.setItem('users', JSON.stringify(this.users))
    }
  }
}) 