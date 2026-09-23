<template>
    <div class="home-page">
        <h1>欢迎</h1>
        <p>登录成功后的占位首页。</p>
        <el-button type="primary" @click="handleLogout">退出登录</el-button>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = (): void => {
    router.push('/login')
}
</script>

<style scoped lang="scss">
.home-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    height: 100%;

    h1 {
        font-size: 28px;
        color: #303133;
    }

    p {
        font-size: 14px;
        color: #909399;
    }
}
</style>