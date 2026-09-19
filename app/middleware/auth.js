// 管理頁：向 server 確認 cookie 有效，否則導去登入
export default defineNuxtRouteMiddleware(async () => {
  if (!(await useAuthStore().check())) {
    return navigateTo('/login')
  }
})
