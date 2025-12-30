import { defineToolConfig, getRssItems } from '../utils/index.js';

export default defineToolConfig({
  name: 'get-vnexpress-news',
  description: 'Lấy tin tức mới nhất từ VnExpress - trang báo điện tử hàng đầu Việt Nam, bao gồm tin tức thời sự, kinh doanh, giải trí, thể thao, pháp luật, công nghệ và đời sống',
  func: () => getRssItems('https://vnexpress.net/rss/tin-moi-nhat.rss'),
});
