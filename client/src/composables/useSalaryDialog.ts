import { ref } from 'vue'

/** Which role's salary chart is open in the dialog ('' = closed). */
const roleId = ref('')

export function useSalaryDialog() {
  return {
    roleId,
    open: (id: string) => (roleId.value = id),
    close: () => (roleId.value = ''),
  }
}
