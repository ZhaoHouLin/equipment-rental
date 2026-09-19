<script setup>
const route = useRoute()
const event = useRequestEvent()
setResponseStatus(event, 404)
</script>

<template lang="pug">
.notfound-page
  NuxtLink(to='/') 回首頁
  h1 {{ route.params.slug }} Not Found
  //- p {{ route.params.slug }}
</template>

<style lang="stylus" scoped>
.notfound-page
  size(,100vh)
  flex(,,column-reverse)
  color color_secondary
  background-color color_tertiary
  h1
    text-shadow 4px 4px 4px color_secondary
    transition .5s
  a
    text-decoration none
    font-size 1.2rem
    padding 0.8rem
    margin 1rem
    border-radius 1rem
    // border 1px solid color_secondary
    box-shadow 4px 4px 12px color_secondary
    color color_secondary
    font-weight 900
    transition .5s
    &:hover
      box-shadow none
      ~ h1
        text-shadow none
</style>
