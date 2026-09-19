<script setup>
import { NForm, NFormItem, NButton, NSelect, NInput, NAutoComplete, useMessage } from "naive-ui"

const message = useMessage()
const form = useFormStore()
const catalog = useCatalogStore()
const isMobile = useIsMobile()
const formRef = ref(null)

const deptOptions = computed(() => catalog.settings.departments.map((d) => ({ label: d, value: d })))

// 信箱自動補網域（設定有網域時）
const mailOptions = computed(() => {
  const domain = catalog.settings.mailDomain
  if (!domain) return []
  const prefix = form.model.email.split("@")[0]
  return prefix ? [{ label: `${prefix}@${domain}`, value: `${prefix}@${domain}` }] : []
})

const rules = {
  name: { required: true, message: "請輸入姓名", trigger: "blur" },
  dept: { required: true, message: "請選擇單位", trigger: ["blur", "change"] },
  email: {
    required: true,
    trigger: ["input", "blur"],
    validator(_, value) {
      if (!value) return new Error("請輸入聯絡信箱")
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return new Error("信箱格式不正確")
      const d = catalog.settings.mailDomain
      if (d && !value.toLowerCase().endsWith("@" + d.toLowerCase())) return new Error(`請使用 @${d} 信箱`)
      return true
    },
  },
}

const next = (e) => {
  e.preventDefault()
  formRef.value?.validate((errors) => (errors ? message.error("請檢查欄位") : form.next()))
}
</script>

<template lang="pug">
NForm(ref="formRef" :model="form.model" :rules="rules" :label-placement="isMobile ? 'top' : 'left'" :label-width="90")
  NFormItem(label="借用單位" path="dept")
    NSelect(v-model:value="form.model.dept" placeholder="請選擇單位" :options="deptOptions")
  NFormItem(label="借用人" path="name")
    NInput(v-model:value="form.model.name" placeholder="請輸入姓名")
  NFormItem(label="聯絡信箱" path="email")
    NAutoComplete(v-model:value="form.model.email" :options="mailOptions" placeholder="請輸入聯絡信箱")
  NFormItem(label="聯絡電話")
    NInput(v-model:value="form.model.phone" placeholder="分機或手機")
  .btn
    NButton(type="primary" size="large" @click="next") 下一步
</template>
