<template>
  <slot v-if="hasPermission" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Permission } from '../stores/auth'
import { checkPermission } from '../directives/permission'

interface Props {
  permission: Permission | Permission[]
  all?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  all: false
})

const hasPermission = computed(() => {
  return checkPermission(props.permission, props.all)
})
</script> 