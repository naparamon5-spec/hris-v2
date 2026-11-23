// Shared confirmation dialog. Usage:
//   const { confirm } = useConfirm()
//   if (await confirm({ title: 'Approve?', message: '…', confirmText: 'Approve' })) { … }
// Options: title, message, confirmText, cancelText, tone ('primary' | 'danger'), icon.
export const useConfirm = () => {
  const dialog = useState('confirm-dialog', () => null)

  const confirm = (options = {}) => new Promise((resolve) => {
    // Close any dialog that is already open as "cancelled".
    if (dialog.value?.resolve) dialog.value.resolve(false)
    dialog.value = {
      title: 'Are you sure?',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      tone: 'primary',
      icon: 'check',
      ...options,
      resolve
    }
  })

  const close = (answer) => {
    const d = dialog.value
    dialog.value = null
    d?.resolve(answer)
  }

  return { dialog, confirm, close }
}
