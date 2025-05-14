import type { Directive, DirectiveBinding } from 'vue'
import { useAuthStore, Permission } from '../stores/auth'

/**
 * 权限指令 v-permission
 * 用法:
 * v-permission="'view_report'" - 检查单个权限
 * v-permission="['view_report', 'create_report']" - 检查多个权限（任一权限）
 * v-permission:all="['view_report', 'create_report']" - 检查多个权限（所有权限）
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const authStore = useAuthStore()
    const { value, arg } = binding
    
    if (!value) {
      return; // 如果没有指定权限值，则不做任何处理
    }
    
    // 检查是否需要所有权限
    const needAll = arg === 'all'
    // 将单个权限转换为数组
    const permissions = Array.isArray(value) ? value : [value]
    
    try {
      const hasPermission = needAll
        ? authStore.hasAllPermissions(permissions)
        : authStore.hasAnyPermission(permissions)
      
      if (!hasPermission) {
        // 没有权限时隐藏元素
        el.style.display = 'none'
      }
    } catch (error) {
      console.error('权限检查失败:', error)
      // 出错时默认不显示元素
      el.style.display = 'none'
    }
  }
}

// 注册权限指令
export function setupPermissionDirective(app: any) {
  app.directive('permission', permission)
}

// 导出独立的权限检查函数，用于组件内部使用
export function checkPermission(
  permission: Permission | Permission[],
  needAll = false
): boolean {
  try {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated()) return false
    
    const permissions = Array.isArray(permission) ? permission : [permission]
    
    return needAll
      ? authStore.hasAllPermissions(permissions)
      : authStore.hasAnyPermission(permissions)
  } catch (error) {
    console.error('权限检查失败:', error)
    return false
  }
} 