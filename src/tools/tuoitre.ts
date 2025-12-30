import { defineToolConfig, getRssItems } from '../utils/index.js';

export default defineToolConfig({
  name: 'get-tuoitre-news',
  description: 'Lấy tin tức mới nhất từ Tuổi Trẻ - trang báo điện tử uy tín của Việt Nam, cung cấp tin tức thời sự, xã hội, kinh tế, văn hóa, giáo dục, thể thao và giải trí',
  func: () => getRssItems('https://tuoitre.vn/rss/tin-moi-nhat.rss'),
});
