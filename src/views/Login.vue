<template>
    <div class="login-page">
        <div class="login-card">
            <h1 class="login-title">登录</h1>
            <p class="login-subtitle">请输入用户名和密码</p>
            <el-form
                ref="formRef"
                :model="form"
                :rules="rules"
                label-position="top"
                @keyup.enter="handleLogin"
            >
                <el-form-item label="用户名" prop="username">
                    <el-input
                        v-model="form.username"
                        placeholder="请输入用户名"
                        clearable
                        autocomplete="username"
                    />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input
                        v-model="form.password"
                        type="password"
                        placeholder="请输入密码"
                        show-password
                        autocomplete="current-password"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button
                        type="primary"
                        class="login-button"
                        :loading="loading"
                        @click="handleLogin"
                    >
                        {{ loading ? '登录中…' : '登 录' }}
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface LoginForm {
    username: string
    password: string
}

const router = useRouter()
const formRef = ref<FormInstance>()

const form = ref<LoginForm>({
    username: '',
    password: '',
})

const loading = ref(false)

const rules: FormRules<LoginForm> = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 32, message: '用户名长度为 2 到 32 个字符', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 64, message: '密码长度为 6 到 64 位', trigger: 'blur' },
    ],
}

const handleLogin = async (): Promise<void> => {
    if (!formRef.value) {
        return
    }

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }

    loading.value = true
    try {
        // 说明：当前仓库无后端鉴权服务，此处以演示逻辑模拟登录。
        // 接入真实后端时，请替换为 axios 调用 POST /login，并避免明文记录密码。
        await new Promise((resolve) => setTimeout(resolve, 600))
        ElMessage.success('登录成功')
        await router.push('/home')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped lang="scss">
.login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.login-card {
    width: 360px;
    padding: 40px 36px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.login-title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    color: #303133;
}

.login-subtitle {
    margin: 8px 0 28px;
    font-size: 14px;
    text-align: center;
    color: #909399;
}

.login-button {
    width: 100%;
}
</style>