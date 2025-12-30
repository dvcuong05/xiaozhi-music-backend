import { defineToolConfig, getRssItems } from '../utils/index.js';

export default defineToolConfig({
  name: 'get-zingnews-news',
  description: 'Lấy tin tức mới nhất từ Zing News - trang tin tức trực tuyến của VNG, cung cấp tin tức nóng hổi về thời sự, giải trí, thể thao, công nghệ và đời sống',
  func: () => getRssItems('https://zingnews.vn/rss'),
});
