import { defineToolConfig, getRssItems } from '../utils';

export default defineToolConfig({
  name: 'get-dantri-news',
  description: 'Lấy tin tức mới nhất từ Dân Trí - trang báo điện tử uy tín Việt Nam, cung cấp tin tức tổng hợp về thời sự, kinh tế, xã hội, thể thao, giải trí, công nghệ và sức khỏe',
  func: () => getRssItems('https://dantri.com.vn/rss/trang-chu.rss'),
});
