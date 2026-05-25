<script setup lang="ts">
</script>

<template>
  <div class="about-page">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)"/>
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">关于</h1>
    </div>

    <div class="space-y-10">
      <!-- About Blog -->
      <section>
        <h2
            class="text-lg font-bold mb-4 flex items-center gap-2"
            style="color: var(--color-text)"
        >
          <span class="w-1 h-4 rounded-full shrink-0" style="background: var(--gradient-primary)"/>
          关于本站
        </h2>
        <div class="rounded-xl p-5 leading-relaxed text-sm"
             style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
          <p class="mb-3" style="color: var(--color-text-secondary)">
            欢迎来到 <strong class="text-gradient">LinzyBlog</strong>，一个记录技术学习与思考的个人博客。
            这里涵盖了后端开发、AI 技术、容器化、微服务等领域的内容。
          </p>
          <p style="color: var(--color-text-secondary)">
            每一篇文章都是学习路上的笔记，希望这些内容能对你有所帮助。
          </p>
        </div>
      </section>

      <!-- Tech Stack -->
      <section>
        <h2
            class="text-lg font-bold mb-4 flex items-center gap-2"
            style="color: var(--color-text)"
        >
          <span class="w-1 h-4 rounded-full shrink-0" style="background: var(--gradient-primary)"/>
          技术栈
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
              v-for="tech in ['Vue 3', 'Node.js', 'Go', 'Docker', 'MySQL', 'Redis', 'TypeScript', 'Tailwind CSS']"
              :key="tech"
              class="text-center py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-default hover:-translate-y-1"
              style="background-color: var(--color-card); color: var(--color-text-secondary); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)"
          >
            {{ tech }}
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section>
        <h2
            class="text-lg font-bold mb-4 flex items-center gap-2"
            style="color: var(--color-text)"
        >
          <span class="w-1 h-4 rounded-full shrink-0" style="background: var(--gradient-primary)"/>
          联系方式
        </h2>
        <div class="flex flex-wrap gap-3">
          <a href="mailto:hello@linzyblog.dev"
             class="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
             style="background-color: var(--color-card); border: 1px solid var(--color-border); color: var(--color-text-secondary); box-shadow: var(--shadow-sm)"
          >
            <svg class="w-4 h-4" style="color: var(--color-primary)" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 7l-10 7L2 7"/>
            </svg>
            2906594394@qq.com
          </a>
          <a href="https://github.com/maxinjian123" target="_blank"
             class="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
             style="background-color: var(--color-card); border: 1px solid var(--color-border); color: var(--color-text-secondary); box-shadow: var(--shadow-sm)"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                  d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </section>
    </div>
  </div>
</template>