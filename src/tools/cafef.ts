import { defineToolConfig, getRssItems } from '../utils/index.js';

export default defineToolConfig({
  name: 'get-cafef-news',
  description: 'Lấy tin tức kinh tế tài chính mới nhất từ CafeF - trang báo điện tử chuyên về kinh tế, chứng khoán, bất động sản, doanh nghiệp và thị trường Việt Nam',
  func: () => getRssItems('https://cafef.vn/rss/trang-chu.rss'),
});
