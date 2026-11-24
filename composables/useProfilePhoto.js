// Profile photo shared by the Profile page and the header avatar.
// hris_server has no photo endpoint yet (BACKEND.md §0 #6), so — like the mobile app,
// which keeps it on the phone — the photo is saved in this browser only.
const KEY = 'hris.profilePhoto'

export const useProfilePhoto = () => {
  const photo = useState('profilePhoto', () => '')
  // Read after mount so the server-rendered HTML (initials) matches on hydration.
  onMounted(() => {
    if (photo.value) return
    try { photo.value = localStorage.getItem(KEY) || '' } catch { /* storage blocked */ }
  })
  const setPhoto = (v) => {
    photo.value = v || ''
    try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY) } catch { /* storage blocked */ }
  }
  return { photo, setPhoto }
}
