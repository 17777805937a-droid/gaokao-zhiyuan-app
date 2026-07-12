/**
 * 通用类型定义
 */

/** API 响应格式 */
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 导航状态 */
export interface NavState {
  canGoBack: boolean;
  canGoForward: boolean;
  currentPath: string;
}

/** 省份配置信息 */
export interface ProvinceConfig {
  code: string;
  name: string;
  mode: '3+3' | '3+1+2';
  maxVolunteers: number;
  volunteerUnit: 'major+school' | 'major_group';
  hasAdjustment: boolean;
  checkLevel: 'major' | 'group';
  tip: string;
}

/** 科目配置 */
export interface SubjectOption {
  value: string;
  label: string;
  icon: string;
  type: 'first' | 'second';
}

/** 权重模板 */
export interface WeightTemplate {
  mode: string;
  name: string;
  weights: { school: number; major: number; city: number };
  desc: string;
}

/** 四档配置 */
export interface TierConfig {
  key: string;
  name: string;
  hitRateRange: string;
  color: string;
  bgColor: string;
}
