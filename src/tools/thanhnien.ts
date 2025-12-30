import { defineToolConfig, getRssItems } from '../utils';

export default defineToolConfig({
  name: 'get-thanhnien-news',
  description: 'Lấy tin tức mới nhất từ Thanh Niên - trang báo điện tử hàng đầu Việt Nam, bao gồm tin tức thời sự, kinh tế, giáo dục, pháp luật, văn hóa, thể thao và đời sống',
  func: () => getRssItems('https://thanhnien.vn/rss/home.rss'),
});
