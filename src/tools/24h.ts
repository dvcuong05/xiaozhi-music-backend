import { defineToolConfig, getRssItems } from '../utils/index.js';

export default defineToolConfig({
  name: 'get-24h-news',
  description: 'Lấy tin tức mới nhất từ 24h.com.vn - trang tin tức tổng hợp hàng đầu Việt Nam, cập nhật nhanh tin tức thời sự, giải trí, thể thao, kinh tế và đời sống 24/7',
  func: () => getRssItems('https://www.24h.com.vn/upload/rss/trangchu24h.rss'),
});
