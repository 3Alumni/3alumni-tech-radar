import { ref } from 'vue'

/** Which role's salary chart is open in the dialog ('' = closed). */
const roleId = ref('')

export interface SalaryChart {
  title: string
  note: string
  points: { month: string; chf: number }[]
}

const chart = ref<SalaryChart | null>(null)

export function useSalaryDialog() {
  return {
    roleId,
    chart,
    open: (id: string) => {
      chart.value = null
      roleId.value = id
    },
    openChart: (next: SalaryChart) => {
      chart.value = next
      roleId.value = '__chart'
    },
    close: () => {
      roleId.value = ''
      chart.value = null
    },
  }
}
