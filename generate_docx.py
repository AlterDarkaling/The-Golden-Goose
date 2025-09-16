#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大鹅爱记账软件使用说明书 - Word文档生成脚本
适用于软著申请的专业文档格式
"""

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT, WD_TAB_ALIGNMENT
from docx.enum.section import WD_SECTION_START
from docx.oxml.shared import OxmlElement, qn
import datetime

def create_software_manual():
    """创建软件使用说明书Word文档"""
    
    # 创建文档
    doc = Document()
    
    # 设置页面格式
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1.25)
    
    # 创建自定义样式
    create_custom_styles(doc)
    
    # 添加文档内容
    add_title_page(doc)
    add_toc_placeholder(doc)
    add_main_content(doc)
    
    # 保存文档
    doc.save('大鹅爱记账软件使用说明书_V3.0.0.docx')
    print("✅ Word文档已生成：大鹅爱记账软件使用说明书_V3.0.0.docx")

def create_custom_styles(doc):
    """创建自定义样式"""
    styles = doc.styles
    
    # 标题1样式
    if 'CustomTitle1' not in [style.name for style in styles]:
        title1_style = styles.add_style('CustomTitle1', WD_STYLE_TYPE.PARAGRAPH)
        title1_style.font.name = '微软雅黑'
        title1_style.font.size = Pt(16)
        title1_style.font.bold = True
        title1_style.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        title1_style.paragraph_format.space_before = Pt(12)
        title1_style.paragraph_format.space_after = Pt(6)
    
    # 标题2样式
    if 'CustomTitle2' not in [style.name for style in styles]:
        title2_style = styles.add_style('CustomTitle2', WD_STYLE_TYPE.PARAGRAPH)
        title2_style.font.name = '微软雅黑'
        title2_style.font.size = Pt(14)
        title2_style.font.bold = True
        title2_style.font.color.rgb = RGBColor(0x44, 0x44, 0x44)
        title2_style.paragraph_format.space_before = Pt(10)
        title2_style.paragraph_format.space_after = Pt(4)
    
    # 标题3样式
    if 'CustomTitle3' not in [style.name for style in styles]:
        title3_style = styles.add_style('CustomTitle3', WD_STYLE_TYPE.PARAGRAPH)
        title3_style.font.name = '微软雅黑'
        title3_style.font.size = Pt(12)
        title3_style.font.bold = True
        title3_style.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
        title3_style.paragraph_format.space_before = Pt(8)
        title3_style.paragraph_format.space_after = Pt(3)
    
    # 正文样式
    if 'CustomBody' not in [style.name for style in styles]:
        body_style = styles.add_style('CustomBody', WD_STYLE_TYPE.PARAGRAPH)
        body_style.font.name = '宋体'
        body_style.font.size = Pt(11)
        body_style.paragraph_format.line_spacing = 1.15
        body_style.paragraph_format.space_after = Pt(3)
        body_style.paragraph_format.first_line_indent = Inches(0.25)

def add_title_page(doc):
    """添加封面页"""
    # 主标题
    title = doc.add_paragraph()
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    title_run = title.add_run("大鹅爱记账")
    title_run.font.name = '微软雅黑'
    title_run.font.size = Pt(24)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0x66, 0x7e, 0xea)
    
    # 副标题
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    subtitle_run = subtitle.add_run("软件使用说明书")
    subtitle_run.font.name = '微软雅黑'
    subtitle_run.font.size = Pt(18)
    subtitle_run.font.bold = True
    
    # 空行
    doc.add_paragraph()
    doc.add_paragraph()
    
    # 软件信息表格
    table = doc.add_table(rows=8, cols=2)
    table.style = 'Table Grid'
    
    info_data = [
        ('软件名称', '大鹅爱记账'),
        ('软件版本', 'V3.0.0'),
        ('开发平台', '微信小程序'),
        ('软件类型', '个人财务管理应用'),
        ('开发语言', 'JavaScript、WXML、WXSS'),
        ('适用系统', 'iOS、Android（通过微信小程序运行）'),
        ('开发完成日期', '2024年12月'),
        ('文档版本', 'V3.0.0')
    ]
    
    for i, (key, value) in enumerate(info_data):
        row = table.rows[i]
        row.cells[0].text = key
        row.cells[1].text = value
        # 设置表格样式
        for cell in row.cells:
            for paragraph in cell.paragraphs:
                paragraph.style = 'CustomBody'
                for run in paragraph.runs:
                    run.font.name = '宋体'
                    run.font.size = Pt(11)
    
    # 页面底部信息
    doc.add_paragraph()
    doc.add_paragraph()
    doc.add_paragraph()
    
    footer_info = doc.add_paragraph()
    footer_info.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    footer_run = footer_info.add_run(f"文档生成日期：{datetime.datetime.now().strftime('%Y年%m月%d日')}")
    footer_run.font.name = '宋体'
    footer_run.font.size = Pt(10)
    footer_run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
    
    # 添加分页符
    doc.add_page_break()

def add_toc_placeholder(doc):
    """添加目录占位符"""
    toc_title = doc.add_paragraph("目  录")
    toc_title.style = 'CustomTitle1'
    toc_title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    
    # 目录内容
    toc_items = [
        "1. 软件概述 ......................................................... 3",
        "2. 系统要求与安装 .................................................. 5", 
        "3. 功能模块详细说明 ................................................ 6",
        "4. 核心算法说明 ................................................... 15",
        "5. 数据管理 ....................................................... 17",
        "6. 用户界面说明 ................................................... 19",
        "7. 使用场景与案例 ................................................. 21",
        "8. 常见问题与解决方案 ............................................. 23",
        "9. 版本更新说明 ................................................... 25",
        "10. 技术支持与联系方式 ............................................ 26",
        "附录A：资产分类详细说明 ........................................... 27",
        "附录B：负债分类详细说明 ........................................... 28",
        "附录C：快捷键和操作技巧 ........................................... 29"
    ]
    
    for item in toc_items:
        toc_para = doc.add_paragraph(item)
        toc_para.style = 'CustomBody'
        toc_para.paragraph_format.first_line_indent = Inches(0)
    
    doc.add_page_break()

def add_main_content(doc):
    """添加主要内容"""
    
    # 1. 软件概述
    add_section_title(doc, "1. 软件概述")
    
    add_subsection_title(doc, "1.1 软件简介")
    add_body_text(doc, "大鹅爱记账是一款基于微信小程序开发的智能个人财务管理软件，严格遵循传统会计准则，采用专业的资产负债分类体系，为个人用户提供企业级的财务管理精度。软件通过现代化的界面设计和智能化的数据分析，帮助用户建立正确的财务管理理念，实现个人财富的科学管理。")
    
    add_subsection_title(doc, "1.2 设计理念")
    add_body_text(doc, "软件基于传统会计准则和现金流管理理念，采用以下核心设计原则：")
    
    design_principles = [
        "流动资产管理：现金类资产 + 短期理财资产（按实际金额/应计利息计量）",
        "金融资产管理：股票/基金 + 固定收益（按市值重估/票面价值计量）",
        "实物资产管理：消费型资产（自动折旧）+ 增值型资产（市场重估）",
        "其他资产管理：无形资产（按期摊销）+ 预付资产（时间分摊）",
        "负债分离管理：流动负债 + 长期负债 + 其他负债（本金利息完全分离）"
    ]
    
    for principle in design_principles:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(principle)
    
    add_subsection_title(doc, "1.3 主要特点")
    features = [
        "专业的会计分类体系：4大资产类型12子类 + 3大负债类型7子类",
        "智能折旧计算：自动计算消费性资产折旧，提供理性消费建议",
        "现金流分析：实时监控月收入、月支出、净现金流动态",
        "财务健康诊断：基于现金流状况提供财务健康评估",
        "多维度数据展示：支持多种排序和筛选方式",
        "数据安全保障：本地存储，保护用户隐私"
    ]
    
    for i, feature in enumerate(features, 1):
        para = doc.add_paragraph()
        para.style = 'List Number'
        para.add_run(feature)
    
    # 2. 系统要求与安装
    add_section_title(doc, "2. 系统要求与安装")
    
    add_subsection_title(doc, "2.1 系统要求")
    requirements = [
        "操作系统：iOS 9.0及以上版本，Android 5.0及以上版本",
        "微信版本：微信7.0及以上版本",
        "网络要求：需要网络连接以加载小程序",
        "存储空间：约10MB本地存储空间"
    ]
    
    for req in requirements:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(req)
    
    add_subsection_title(doc, "2.2 安装方式")
    installation_steps = [
        "打开微信应用",
        "通过以下方式之一访问小程序：\n   • 微信搜索\"大鹅爱记账\"\n   • 扫描小程序二维码\n   • 通过好友分享链接",
        "点击进入小程序即可开始使用"
    ]
    
    for i, step in enumerate(installation_steps, 1):
        para = doc.add_paragraph()
        para.style = 'List Number'
        para.add_run(step)
    
    # 3. 功能模块详细说明
    add_section_title(doc, "3. 功能模块详细说明")
    
    # 3.1 欢迎引导页面
    add_subsection_title(doc, "3.1 欢迎引导页面")
    
    add_sub_subsection_title(doc, "3.1.1 功能概述")
    add_body_text(doc, "首次使用软件时，系统将显示欢迎引导页面，帮助用户了解软件功能和理念。")
    
    add_sub_subsection_title(doc, "3.1.2 操作步骤")
    welcome_steps = [
        "首次打开小程序，自动进入欢迎页面",
        "阅读软件介绍和核心理念",
        "设置用户基本信息（昵称、头像等）",
        "选择是否需要功能引导教程",
        "完成初始化设置"
    ]
    
    for i, step in enumerate(welcome_steps, 1):
        para = doc.add_paragraph()
        para.style = 'List Number'
        para.add_run(step)
    
    add_sub_subsection_title(doc, "3.1.3 功能特点")
    welcome_features = [
        "清晰的软件理念介绍",
        "可选的示例数据加载",
        "个性化用户信息设置",
        "交互式功能引导"
    ]
    
    for feature in welcome_features:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(feature)
    
    # 3.2 智能首页
    add_subsection_title(doc, "3.2 智能首页")
    
    add_sub_subsection_title(doc, "3.2.1 功能概述")
    add_body_text(doc, "首页提供财务概览、现金流分析、资产负债列表等核心功能，是用户日常使用的主要界面。")
    
    add_sub_subsection_title(doc, "3.2.2 主要功能")
    
    add_body_text(doc, "财务概览面板：")
    overview_features = [
        "实时净资产显示",
        "月现金流统计（收入/支出/净现金流）",
        "财务健康状态评估",
        "资产负债数量统计"
    ]
    
    for feature in overview_features:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(feature)
    
    add_body_text(doc, "智能筛选功能：")
    filter_features = [
        "多维度排序：默认排序、按金额、按天数、按购买时间、按每日成本",
        "分类筛选：支持一级分类和二级分类筛选",
        "状态筛选：10种物品状态（使用中、吃灰中、已卖出等）",
        "资产负债类型切换"
    ]
    
    for feature in filter_features:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(feature)
    
    add_body_text(doc, "资产负债列表：")
    list_features = [
        "卡片式展示设计",
        "详细的资产信息显示",
        "快速操作按钮",
        "状态标识和提醒"
    ]
    
    for feature in list_features:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(feature)
    
    # 4. 核心算法说明
    add_section_title(doc, "4. 核心算法说明")
    
    add_subsection_title(doc, "4.1 折旧计算算法")
    
    add_sub_subsection_title(doc, "4.1.1 算法原理")
    add_body_text(doc, "系统采用直线法折旧计算，根据资产类型预设折旧率：")
    
    # 添加算法公式
    formula_para = doc.add_paragraph()
    formula_para.style = 'CustomBody'
    formula_para.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    formula_run = formula_para.add_run("当前价值 = 原始价值 × (1 - 折旧率 × 使用年数)")
    formula_run.font.name = 'Consolas'
    formula_run.font.size = Pt(10)
    
    formula_para2 = doc.add_paragraph()
    formula_para2.style = 'CustomBody'
    formula_para2.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    formula_run2 = formula_para2.add_run("累计折旧 = 原始价值 - 当前价值")
    formula_run2.font.name = 'Consolas'
    formula_run2.font.size = Pt(10)
    
    formula_para3 = doc.add_paragraph()
    formula_para3.style = 'CustomBody'
    formula_para3.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    formula_run3 = formula_para3.add_run("月均折旧 = 累计折旧 ÷ 使用月数")
    formula_run3.font.name = 'Consolas'
    formula_run3.font.size = Pt(10)
    
    add_sub_subsection_title(doc, "4.1.2 预设折旧率")
    depreciation_rates = [
        "手机通讯：40%/年",
        "电脑数码：35%/年",
        "家用电器：20%/年",
        "交通工具：25%/年"
    ]
    
    for rate in depreciation_rates:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(rate)
    
    # 5. 数据管理
    add_section_title(doc, "5. 数据管理")
    
    add_subsection_title(doc, "5.1 数据存储")
    
    add_sub_subsection_title(doc, "5.1.1 存储方式")
    storage_methods = [
        "采用微信小程序本地存储机制",
        "所有数据存储在用户设备本地",
        "不上传任何个人财务信息到服务器"
    ]
    
    for method in storage_methods:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(method)
    
    add_sub_subsection_title(doc, "5.1.2 数据结构")
    add_body_text(doc, "主要数据结构包括：")
    
    data_structure = [
        "assets_data：资产数据数组",
        "liabilities_data：负债数据数组",
        "user_info：用户信息对象",
        "settings_data：设置信息对象",
        "app_initialized：应用初始化标识",
        "tutorial_completed：教程完成标识"
    ]
    
    for structure in data_structure:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(structure)
    
    # 6. 用户界面说明
    add_section_title(doc, "6. 用户界面说明")
    
    add_subsection_title(doc, "6.1 界面设计原则")
    
    add_sub_subsection_title(doc, "6.1.1 设计理念")
    design_concepts = [
        "简洁现代的视觉风格",
        "直观易用的交互设计",
        "响应式布局适配",
        "无障碍访问支持"
    ]
    
    for concept in design_concepts:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(concept)
    
    add_sub_subsection_title(doc, "6.1.2 色彩方案")
    color_scheme = [
        "主色调：渐变蓝紫色 (#667eea → #764ba2)",
        "辅助色：浅灰色 (#f5f5f5)",
        "文字色：深灰色 (#333333)",
        "强调色：红色 (#ff4757) 用于警告和删除"
    ]
    
    for color in color_scheme:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(color)
    
    # 7. 使用场景与案例
    add_section_title(doc, "7. 使用场景与案例")
    
    add_subsection_title(doc, "7.1 典型使用场景")
    
    add_sub_subsection_title(doc, "7.1.1 个人用户场景")
    user_scenarios = [
        "理财新手：学习资产负债概念，建立财务管理意识",
        "消费者：管理电子产品等消费性资产，理性消费决策",
        "投资者：跟踪投资组合现金流，优化资产配置",
        "贷款用户：分析贷款成本效益，制定还款计划"
    ]
    
    for scenario in user_scenarios:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(scenario)
    
    # 8. 版本更新说明
    add_section_title(doc, "8. 版本更新说明")
    
    add_subsection_title(doc, "8.1 版本历史")
    
    add_sub_subsection_title(doc, "8.1.1 V3.0.0 (当前版本)")
    add_body_text(doc, "主要更新：")
    v3_updates = [
        "新增交互式功能引导教程",
        "优化用户界面和交互体验", 
        "完善数据备份和恢复功能",
        "修复已知问题和性能优化"
    ]
    
    for update in v3_updates:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(update)
    
    add_sub_subsection_title(doc, "8.1.2 V2.0.0")
    add_body_text(doc, "主要更新：")
    v2_updates = [
        "新增消费性资产自动折旧计算",
        "新增贷款计算器功能",
        "新增财务健康诊断系统",
        "重构数据模型和UI设计"
    ]
    
    for update in v2_updates:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(update)
    
    # 9. 技术支持与联系方式
    add_section_title(doc, "9. 技术支持与联系方式")
    
    add_subsection_title(doc, "9.1 技术支持")
    
    add_sub_subsection_title(doc, "9.1.1 问题反馈")
    support_info = [
        "邮箱：darkaling@qq.com",
        "反馈方式：小程序内意见反馈功能",
        "响应时间：1-3个工作日"
    ]
    
    for info in support_info:
        para = doc.add_paragraph()
        para.style = 'List Bullet'
        para.add_run(info)
    
    add_subsection_title(doc, "9.2 法律声明")
    
    add_sub_subsection_title(doc, "9.2.1 版权信息")
    add_body_text(doc, "本软件享有完整的知识产权，受相关法律法规保护。未经授权，不得复制、修改、分发或用于商业用途。")
    
    add_sub_subsection_title(doc, "9.2.2 免责声明")
    add_body_text(doc, "本软件提供的财务建议和计算结果仅供参考，用户应根据实际情况做出决策。开发者不对用户的投资决策和财务损失承担责任。")
    
    # 附录
    add_section_title(doc, "附录")
    
    add_subsection_title(doc, "附录A：资产分类详细说明")
    
    add_sub_subsection_title(doc, "A.1 流动资产分类")
    add_body_text(doc, "现金类资产：银行存款、现金、数字钱包、货币基金")
    add_body_text(doc, "短期理财资产：银行理财、短期国债、结构性存款")
    
    add_sub_subsection_title(doc, "A.2 金融资产分类")
    add_body_text(doc, "股票基金：股票、基金、ETF、可转债")
    add_body_text(doc, "固定收益：长期国债、企业债、定期存款")
    
    add_sub_subsection_title(doc, "A.3 实物资产分类")
    add_body_text(doc, "消费型资产：手机通讯、电脑数码、家用电器、交通工具、服装鞋帽、运动器材")
    add_body_text(doc, "增值型资产：房产、收藏品、贵金属")
    
    add_subsection_title(doc, "附录B：负债分类详细说明")
    
    add_sub_subsection_title(doc, "B.1 流动负债")
    add_body_text(doc, "信用卡债务、短期借款、应付账款")
    
    add_sub_subsection_title(doc, "B.2 长期负债")
    add_body_text(doc, "房贷、车贷、其他长期贷款")
    
    add_sub_subsection_title(doc, "B.3 其他负债")
    add_body_text(doc, "预收款项、其他应付款")
    
    # 文档结尾
    doc.add_paragraph()
    doc.add_paragraph()
    
    end_info = doc.add_paragraph()
    end_info.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    end_run = end_info.add_run("—— 文档结束 ——")
    end_run.font.name = '宋体'
    end_run.font.size = Pt(10)
    end_run.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

def add_section_title(doc, title):
    """添加一级标题"""
    para = doc.add_paragraph(title)
    para.style = 'CustomTitle1'

def add_subsection_title(doc, title):
    """添加二级标题"""
    para = doc.add_paragraph(title)
    para.style = 'CustomTitle2'

def add_sub_subsection_title(doc, title):
    """添加三级标题"""
    para = doc.add_paragraph(title)
    para.style = 'CustomTitle3'

def add_body_text(doc, text):
    """添加正文"""
    para = doc.add_paragraph(text)
    para.style = 'CustomBody'

if __name__ == "__main__":
    try:
        create_software_manual()
    except ImportError:
        print("❌ 缺少python-docx库，请先安装：")
        print("pip install python-docx")
    except Exception as e:
        print(f"❌ 生成文档时出错：{e}")
        print("请检查环境配置和依赖库")
