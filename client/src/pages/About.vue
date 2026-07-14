<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()

onMounted(() => {
  siteStore.fetchSiteInfo()
})
</script>

<template>
  <lay-card title="关于本站" class="blog-card">
    <div v-if="siteStore.siteInfo" class="about-content">
      <div class="about-header">
        <img
          v-if="siteStore.siteInfo.author_avatar"
          :src="siteStore.siteInfo.author_avatar"
          class="about-avatar"
          alt="avatar"
        />
        <div v-else class="about-avatar">{{ siteStore.siteInfo.author_name[0] }}</div>
        <h2 class="about-name">{{ siteStore.siteInfo.author_name }}</h2>
        <p class="about-bio">{{ siteStore.siteInfo.author_bio }}</p>
      </div>
      <div class="about-section">
        <h4>
          <lay-icon type="layui-icon-about" />
          站点介绍
        </h4>
        <p>{{ siteStore.siteInfo.site_description }}</p>
      </div>
      <div class="about-section">
        <h4>
          <lay-icon type="layui-icon-email" />
          联系方式
        </h4>
        <p>
          <span class="contact-label">邮箱：</span>
          <a v-if="siteStore.siteInfo.author_email" :href="`mailto:${siteStore.siteInfo.author_email}`">
            {{ siteStore.siteInfo.author_email }}
          </a>
          <span v-else>暂无</span>
        </p>
      </div>
    </div>
    <lay-loading v-else :loading="true" tip="加载中..." />
  </lay-card>
</template>

<style scoped>
.about-content {
  padding: 32px;
}

.about-header {
  text-align: center;
  margin-bottom: 40px;
}

.about-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #16baaa;
  color: #fff;
  font-size: 48px;
  box-shadow: 0 8px 24px rgba(22, 186, 170, 0.2);
}

.about-name {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 600;
  color: #333;
}

.about-bio {
  color: #888;
  margin: 0;
  font-size: 15px;
}

.about-section {
  margin-bottom: 32px;
}

.about-section:last-child {
  margin-bottom: 0;
}

.about-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 17px;
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.about-section h4 :deep(.layui-icon) {
  color: #16baaa;
  font-size: 18px;
}

.about-section p {
  color: #555;
  line-height: 1.9;
  margin: 0;
  font-size: 15px;
}

.about-section a {
  color: #16baaa;
  text-decoration: none;
}

.about-section a:hover {
  text-decoration: underline;
}

.contact-label {
  color: #888;
}
</style>
