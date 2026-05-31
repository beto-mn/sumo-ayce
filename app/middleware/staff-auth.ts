export default defineNuxtRouteMiddleware(async to => {
  if (to.path === '/staff/login') return

  const { me, user } = useStaffAuth()

  if (!user.value) {
    await me()
  }

  if (!user.value) {
    return navigateTo('/staff/login')
  }
})
