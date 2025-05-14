<template>
  <div class="profile-page">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人信息</h2>
          <p>管理您的账号信息和设置</p>
        </div>
      </template>
      
      <el-tabs>
        <el-tab-pane label="基本信息">
          <div class="user-info">
            <div class="avatar-container">
              <el-avatar :size="100" :src="currentUser?.avatar">
                {{ currentUser?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <el-button type="primary" class="upload-btn" plain>更换头像</el-button>
            </div>
            
            <el-form :model="userForm" label-width="80px">
              <el-form-item label="用户名">
                <el-input v-model="userForm.username" disabled />
              </el-form-item>
              <el-form-item label="姓名">
                <el-input v-model="userForm.name" />
              </el-form-item>
              <el-form-item label="角色">
                <el-input v-model="userForm.role" disabled />
              </el-form-item>
              <el-form-item>
                <el-button type="primary">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="账号管理">
          <div class="accounts-section">
            <div class="section-header">
              <h3>账号列表</h3>
              <el-button type="primary" @click="dialogVisible = true">新增账号</el-button>
            </div>
            
            <el-table :data="users" style="width: 100%" border>
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="role" label="角色">
                <template #default="scope">
                  <el-tag :type="scope.row.role === 'admin' ? 'danger' : scope.row.role === 'user' ? 'success' : 'info'">
                    {{ 
                      scope.row.role === 'admin' ? '管理员' : 
                      scope.row.role === 'user' ? '普通用户' : '只读用户' 
                    }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="权限" width="300">
                <template #default="scope">
                  <div class="permission-tags">
                    <el-tooltip 
                      v-if="scope.row.permissions.includes(Permission.VIEW_REPORT)"
                      content="允许查看周报" 
                      placement="top"
                    >
                      <el-tag size="small" type="success" effect="plain" class="permission-tag">查看</el-tag>
                    </el-tooltip>
                    <el-tooltip 
                      v-if="scope.row.permissions.includes(Permission.CREATE_REPORT)"
                      content="允许创建周报" 
                      placement="top"
                    >
                      <el-tag size="small" type="primary" effect="plain" class="permission-tag">创建</el-tag>
                    </el-tooltip>
                    <el-tooltip 
                      v-if="scope.row.permissions.includes(Permission.EDIT_REPORT)"
                      content="允许编辑周报" 
                      placement="top"
                    >
                      <el-tag size="small" type="warning" effect="plain" class="permission-tag">编辑</el-tag>
                    </el-tooltip>
                    <el-tooltip 
                      v-if="scope.row.permissions.includes(Permission.DELETE_REPORT)"
                      content="允许删除周报" 
                      placement="top"
                    >
                      <el-tag size="small" type="danger" effect="plain" class="permission-tag">删除</el-tag>
                    </el-tooltip>
                    <el-tooltip 
                      v-if="scope.row.permissions.includes(Permission.MANAGE_USERS)"
                      content="允许管理用户" 
                      placement="top"
                    >
                      <el-tag size="small" type="info" effect="dark" class="permission-tag">用户管理</el-tag>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button 
                    type="primary" 
                    plain 
                    size="small" 
                    :disabled="scope.row.username === 'admin'"
                    @click="editPermissions(scope.row)"
                  >
                    权限设置
                  </el-button>
                  <el-button 
                    type="danger" 
                    plain 
                    size="small" 
                    :disabled="scope.row.username === 'admin'"
                    @click="confirmDelete(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="修改密码">
          <el-form :model="passwordForm" label-width="120px" :rules="passwordRules" ref="passwordFormRef">
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input v-model="passwordForm.currentPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 新增账号对话框 -->
    <el-dialog v-model="dialogVisible" title="新增账号" width="500px">
      <el-form :model="newUserForm" label-width="80px" :rules="rules" ref="newUserFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="newUserForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="newUserForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="newUserForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="newUserForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="newUserForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addUser">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限设置对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="权限设置" width="500px">
      <div v-if="selectedUser" class="permissions-dialog">
        <h3>{{ selectedUser.name }} 的权限设置</h3>
        
        <el-divider content-position="left">周报权限</el-divider>
        <el-checkbox-group v-model="selectedPermissions">
          <el-checkbox :label="Permission.VIEW_REPORT">查看周报</el-checkbox>
          <el-checkbox :label="Permission.CREATE_REPORT" :disabled="selectedUser.role === 'viewer'">创建周报</el-checkbox>
          <el-checkbox :label="Permission.EDIT_REPORT" :disabled="selectedUser.role === 'viewer'">编辑周报</el-checkbox>
          <el-checkbox :label="Permission.DELETE_REPORT" :disabled="selectedUser.role === 'viewer'">删除周报</el-checkbox>
        </el-checkbox-group>
        
        <el-divider content-position="left">管理权限</el-divider>
        <el-checkbox-group v-model="selectedPermissions">
          <el-checkbox :label="Permission.MANAGE_USERS" :disabled="selectedUser.role !== 'admin'">用户管理</el-checkbox>
        </el-checkbox-group>
        
        <div class="permission-tips">
          <p>
            <el-icon><InfoFilled /></el-icon>
            <span>权限说明:</span>
          </p>
          <ul>
            <li><strong>查看周报</strong>: 用户可以查看周报列表和详情</li>
            <li><strong>创建周报</strong>: 用户可以创建新的周报</li>
            <li><strong>编辑周报</strong>: 用户可以编辑周报内容</li>
            <li><strong>删除周报</strong>: 用户可以删除周报</li>
            <li><strong>用户管理</strong>: 用户可以管理其他用户账号和权限</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermissions">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { useAuthStore, Permission } from '../stores/auth'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.getCurrentUser())

// 用户信息表单
const userForm = reactive({
  username: currentUser.value?.username || '',
  name: currentUser.value?.name || '',
  role: currentUser.value?.role === 'admin' ? '管理员' : '普通用户'
})

// 密码修改表单
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const validatePass = (_: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (passwordForm.confirmPassword !== '') {
      passwordFormRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (_: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, validator: validatePass, trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 新增用户对话框
const dialogVisible = ref(false)
const newUserFormRef = ref<FormInstance>()
const newUserForm = reactive({
  username: '',
  name: '',
  password: '',
  confirmPassword: '',
  role: 'user'
})

// 验证规则
const validateConfirmPassword = (_: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== newUserForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 获取用户列表
const users = computed(() => authStore.getAllUsers())

// 新增用户
const addUser = async () => {
  if (!newUserFormRef.value) return
  
  await newUserFormRef.value.validate((valid) => {
    if (valid) {
      // 调用新增用户方法
      const success = authStore.addUser({
        username: newUserForm.username,
        name: newUserForm.name,
        password: newUserForm.password,
        role: newUserForm.role,
        avatar: ''
      })
      
      if (success) {
        ElMessage.success('账号添加成功')
        dialogVisible.value = false
        
        // 重置表单
        newUserForm.username = ''
        newUserForm.name = ''
        newUserForm.password = ''
        newUserForm.confirmPassword = ''
        newUserForm.role = 'user'
      } else {
        ElMessage.error('用户名已存在')
      }
    }
  })
}

// 删除用户
const confirmDelete = (user: any) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user.name} 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (authStore.deleteUser(user.id)) {
      ElMessage.success('用户删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate((valid) => {
    if (valid) {
      // 这里应该调用修改密码的API
      // 这里仅作模拟
      ElMessage.success('密码修改成功')
      
      // 重置表单
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
  })
}

// 权限设置对话框
const permissionDialogVisible = ref(false)
const selectedUser = ref<any>(null)
const selectedPermissions = ref<Permission[]>([])

const editPermissions = (user: any) => {
  selectedUser.value = user
  selectedPermissions.value = [...user.permissions]
  permissionDialogVisible.value = true
}

const savePermissions = () => {
  if (!selectedUser.value) return
  
  // 确保至少有查看权限
  if (!selectedPermissions.value.includes(Permission.VIEW_REPORT)) {
    selectedPermissions.value.push(Permission.VIEW_REPORT)
  }
  
  // 调用更新权限方法
  const success = authStore.updateUserPermissions(
    selectedUser.value.id,
    selectedPermissions.value
  )
  
  if (success) {
    ElMessage.success('权限更新成功')
    permissionDialogVisible.value = false
  } else {
    ElMessage.error('权限更新失败')
  }
}
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 60px);
  padding: 20px;
  background: var(--background-color);
}

.profile-card {
  max-width: 900px;
  margin: 0 auto;
  border-radius: 16px;
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-weight: 600;
  font-size: 1.8em;
  color: var(--text-primary);
}

.card-header p {
  margin: 10px 0 0;
  color: var(--text-secondary);
}

.user-info {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.upload-btn {
  margin-top: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-weight: 600;
  color: var(--text-primary);
}

.accounts-section {
  margin-top: 10px;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.permission-tag {
  margin-right: 0;
}

.permissions-dialog h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.permission-tips {
  margin-top: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.permission-tips p {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 10px;
}

.permission-tips ul {
  margin: 0;
  padding-left: 20px;
}

.permission-tips li {
  margin-bottom: 5px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
  }
  
  .profile-card {
    margin: 0;
  }
}
</style> 