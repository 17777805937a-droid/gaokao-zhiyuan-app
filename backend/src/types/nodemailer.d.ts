/**
 * nodemailer 类型声明兜底（避免 tsc 报 TS7016）。
 * 若后续安装 @types/nodemailer，可删除本文件。
 */
declare module 'nodemailer' {
  // 兜底类型，仅用于通过 tsc 编译；运行时由真实包提供真实实现
  export type Transporter = any;
  const nodemailer: {
    createTransport: (options: any) => Transporter;
  };
  export default nodemailer;
}
