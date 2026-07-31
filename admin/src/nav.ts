import {
    AppstoreOutlined,
    CommentOutlined,
    CustomerServiceOutlined,
    DashboardOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    GithubOutlined,
    LinkOutlined,
    MailOutlined,
    MessageOutlined,
    NotificationOutlined,
    RadarChartOutlined,
    SettingOutlined,
    TagsOutlined
} from "@ant-design/icons-vue";
import {h} from "vue";

export default [
    {key: '/', icon: h(DashboardOutlined), label: '仪表盘'},
    {
        key: 'content',
        icon: h(FileTextOutlined),
        label: '内容管理',
        children: [
            {key: '/articles', icon: h(FileTextOutlined), label: '文章管理'},
            {key: '/categories', icon: h(AppstoreOutlined), label: '分类管理'},
            {key: '/tags', icon: h(TagsOutlined), label: '标签管理'}
        ]
    },
    {
        key: '/crawler',
        icon: h(RadarChartOutlined),
        label: '数据抓取',
        children: [
            {key: '/crawler', icon: h(GithubOutlined), label: 'GitHub抓取'},
            {key: '/music', icon: h(CustomerServiceOutlined), label: '音乐抓取'}
        ]
    },
    {key: '/media', icon: h(FolderOpenOutlined), label: '媒体库'},
    {key: '/comments', icon: h(CommentOutlined), label: '评论管理'},
    {key: '/guestbook', icon: h(MessageOutlined), label: '留言管理'},
    {key: '/announcements', icon: h(NotificationOutlined), label: '公告管理'},
    {key: '/links', icon: h(LinkOutlined), label: '友链管理'},
    {key: '/subscribers', icon: h(MailOutlined), label: '邮件订阅'},
    {key: '/settings', icon: h(SettingOutlined), label: '系统设置'}
]