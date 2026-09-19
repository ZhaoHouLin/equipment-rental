// 窄螢幕判斷（640px 以下），表單標籤位置與步驟列用
export const useIsMobile = () => {
  const isMobile = ref(false)
  onMounted(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    isMobile.value = mq.matches
    mq.addEventListener("change", (e) => (isMobile.value = e.matches))
  })
  return isMobile
}
