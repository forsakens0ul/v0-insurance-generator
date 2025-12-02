"use client";
import React from 'react';
import ComContent from "../../../components/com-content";

import {
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormDependency,
  ProFormList,
  FormListActionType,
  ProFormText,
} from "@ant-design/pro-components";
import { Button, Drawer, Flex, Statistic, message } from "antd";

import { useEffect, useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { qywxAuth } from "~/app/_lib/auth";
import { insertQuickQuotationRecord } from '~/app/_lib/actions';

type ObjectWithProperty = Record<string, string | number>;
type CareerProperty = {
  职业类别: string;
  投保人数: number;
  意外身故_万元: number;
  意外伤残_万元: number;
  附加意外伤害医疗_万元: number;
  住院津贴_元: number;
  驾驶或乘坐非营运性质的机动车_万元: number;
  乘坐客运机动车_万元: number;
  乘坐客运轨道交通车辆_万元: number;
  乘坐客运轮船_万元: number;
  乘坐客运民航班机_万元: number;
  救护车费用_万元: number;
};
type CareerParamObj = {
  label: string;
  value: string;
  固定系数: number;
  身故占比: number;
  伤残占比: number;
  医疗系数: number;
  住院津贴系数: number;
  住院津贴系数折扣: number;
  猝死系数: number;
  历史赔付系数: number;
  企业管理系数: number;
  关联业务: number;
  地区系数: number;
  人员自主核保系数_关联p13: number;
  人数系数: number;

  身故保费?: number;
  伤残保费?: number;
  医疗折扣系数?: number;
  医疗保费?: number;
  住院津贴保费?: number;
  猝死附加?: number;
  猝死保费?: number;
  风险保费合计?: number;
  主险基准保费?: number;
  过程保费?: number;
  整体保费?: number;
  主险保费_每人?: number;
  附加险保费_每人?: number;
  总保费?: number;
  职业类别?: string;
  投保人数?: number;
  意外身故_万元?: number;
  意外伤残_万元?: number;
  附加意外伤害医疗_万元?: number;
  投保人?: string;
  住院津贴_元?: number;
  驾驶或乘坐非营运性质的机动车_万元?: number;
  乘坐客运机动车_万元?: number;
  乘坐客运轨道交通车辆_万元?: number;
  乘坐客运轮船_万元?: number;
  乘坐客运民航班机_万元?: number;
  救护车费用_万元?: number;
};

function Home() {
  const router = useRouter();
  const [screenHeight, setScreenHeight] = useState(667);
  const [screenWidth, setScreenWidth] = useState(375);
  const [openPreview, setOpenPreview] = useState(false);
  useEffect(() => {
    setScreenHeight(window.innerHeight - 140);
    setScreenWidth(window.innerWidth);
  }, []);
  const qywxUserInfo = qywxAuth.getUserInfo();

  const 职业类别选项 = [
    {
      label: "一类",
      value: "一类",
      固定系数: 1.36517857437895,
      身故占比: 0.8,
      伤残占比: 0.2,
      医疗系数: 4.37290786352844,
      住院津贴系数: 0.018119247,
      住院津贴系数折扣: 0.5,
      猝死系数: 0.6,
      历史赔付系数: 1,
      企业管理系数: 1,
      关联业务: 1,
      地区系数: 1,
      人员自主核保系数_关联p13: 1,
      人数系数: 1,

    },
    {
      label: "二类",
      value: "二类",
      固定系数: 1.63821428925473,
      身故占比: 0.8,
      伤残占比: 0.2,
      医疗系数: 5.24748943623413,
      住院津贴系数: 0.026643096,
      住院津贴系数折扣: 0.5,
      猝死系数: 0.6,
      历史赔付系数: 1,
      企业管理系数: 1,
      关联业务: 1,
      地区系数: 1,
      人员自主核保系数_关联p13: 1,
      人数系数: 1
    },
    {
      label: "三类",
      value: "三类",
      固定系数: 2.53149371653327,
      身故占比: 0.7,
      伤残占比: 0.3,
      医疗系数: 8.75206452604031,
      住院津贴系数: 0.038788418,
      住院津贴系数折扣: 0.5,
      猝死系数: 0.6,
      历史赔付系数: 1,
      企业管理系数: 1,
      关联业务: 1,
      地区系数: 1,
      人员自主核保系数_关联p13: 1,
      人数系数: 1.25
    },
    {
      label: "四类",
      value: "四类",
      固定系数: 4.15915647700629,
      身故占比: 0.6,
      伤残占比: 0.4,
      医疗系数: 14.5971963162149,
      住院津贴系数: 0.059830028,
      住院津贴系数折扣: 0.5,
      猝死系数: 0.6,
      历史赔付系数: 1,
      企业管理系数: 1,
      关联业务: 1,
      地区系数: 1,
      人员自主核保系数_关联p13: 1,
      人数系数: 1.25
    },
    {
      label: "五类",
      value: "五类",
      固定系数: 6.83335000487885,
      身故占比: 0.5,
      伤残占比: 0.5,
      医疗系数: 20.7650513572076,
      住院津贴系数: 0.077520894,
      住院津贴系数折扣: 0.5,
      猝死系数: 0.6,
      历史赔付系数: 1,
      企业管理系数: 1,
      关联业务: 1,
      地区系数: 1,
      人员自主核保系数_关联p13: 1,
      人数系数: 1.25
    },
    {
      label: "六类",
      value: "六类",
      固定系数: 10.3312046008418,
      身故占比: 0.5,
      伤残占比: 0.5,
      医疗系数: 29.012589787219,
      住院津贴系数: 0.090272984,
      住院津贴系数折扣: 0.5,
      猝死系数: 0.6,
      历史赔付系数: 1,
      企业管理系数: 1,
      关联业务: 1,
      地区系数: 1,
      人员自主核保系数_关联p13: 1,
      人数系数: 1.25
    },
  ];
  const 猝死保额单列选项 = [
    {
      label: "猝死保额0万元",
      value: 0,
    },
    {
      label: "猝死保额10万元",
      value: 10,
    },
    {
      label: "猝死保额20万元",
      value: 20,
    },
    {
      label: "猝死保额30万元",
      value: 30,
    },
    {
      label: "猝死保额40万元",
      value: 40,
    },
    {
      label: "猝死保额50万元",
      value: 50,
    },
    {
      label: "猝死保额同主险",
      value: "undefined",
    },
  ];
  const 工种选择选项 = [
    {
      label: "正常工种",
      value: "1_1",
    },
    {
      label: "正常工种（人力公司投保）",
      value: "2_1",
    },
    {
      label: "保安、保洁",
      value: "3_5",
    },
    {
      label: "涉高空作业",
      value: "4_1",
    },
    {
      label: "涉特种作业",
      value: "5_1",
    },
  ];
  const 意外医疗扣除赔付比例选项 = [
    {
      label: "意外医疗扣除100元后80%比例赔付",
      value: 1,
    },
    {
      label: "意外医疗扣除100元后90%比例赔付",
      value: 1.2,
    },
    {
      label: "意外医疗扣除100元后100%比例赔付",
      value: 1.4,
    },
  ];
  const 住院津贴免赔天数选项 = [
    {
      label: "免赔0天",
      value: 1.5,
    },
    {
      label: "免赔3天",
      value: 1,
    },
  ];
  const 风险保费固定系数 = 0.6;

  const maxTotalAmount = 300;
  const maxSingleAmount = 200;
  const [tempInputValue, setTempInputValue] = useState<number | null>(0);
  const [overallAverage, setOverallAverage] = useState(0);
  const [careerResult, setCareerResult] = useState<CareerParamObj[]>([]);

  const [careerTypeList, setCareerTypeList] =
    useState<ObjectWithProperty[]>(职业类别选项);

  const [basicParam, setBasicParam] = useState({
    工种选择: "1_1",
    猝死保额单列: 0,
    意外医疗扣除赔付比例: 1,
    住院津贴免赔天数: 1.5,
    投保天数: 365,
    投保人: "",


    careerDetailList: [
      {
        职业类别: undefined,
        投保人数: 10,
        意外身故_万元: 60,
        意外伤残_万元: 60,
        附加意外伤害医疗_万元: 5,
        住院津贴_元: 100,
        驾驶或乘坐非营运性质的机动车_万元: 0,
        乘坐客运机动车_万元: 0,
        乘坐客运轨道交通车辆_万元: 0,
        乘坐客运轮船_万元: 0,
        乘坐客运民航班机_万元: 0,
        救护车费用_万元: 0,
      },
    ],
  });

  const careerDetailListRef = useRef<FormListActionType<CareerProperty>>();

  const getDifferenceByProperty = (
    array1: ObjectWithProperty[] | undefined,
    array2: ObjectWithProperty[] | undefined,
    property1: keyof ObjectWithProperty,
    property2: keyof ObjectWithProperty,
  ) => {
    if (array1 && array2) {
      const array2PropertyValues = new Set(
        array2.map((item) => item[property2]),
      );
      return array1.filter(
        (item) => !array2PropertyValues.has(item[property1]),
      );
    }
    return [];
  };

  const 投保天数系数表 = [
    { key: 1, value: 0.1 },
    { key: 31, value: 0.2 },
    { key: 61, value: 0.3 },
    { key: 91, value: 0.4 },
    { key: 121, value: 0.5 },
    { key: 151, value: 0.6 },
    { key: 181, value: 0.7 },
    { key: 211, value: 0.8 },
    { key: 241, value: 0.85 },
    { key: 271, value: 0.9 },
    { key: 301, value: 0.95 },
    { key: 331, value: 1 },
  ];

  const getDayValueByInput = (input: number): number => {
    if (input == undefined) return 0;
    // 遍历查找表，找到第一个 key 大于或等于输入值的项
    for (let i = 0; i < 投保天数系数表.length - 1; i++) {
      if (
        input >= 投保天数系数表[i]!.key &&
        input < 投保天数系数表[i + 1]!.key
      ) {
        return 投保天数系数表[i]!.value;
      }
    }
    // 如果输入值大于查找表中的所有 key，返回最后一个 value
    return 投保天数系数表[投保天数系数表.length - 1]!.value;
  };

  const costCalculation = (
    工种选择: number,
    猝死保额单列: number | string,
    意外医疗扣除赔付比例: number,
    住院津贴免赔天数: number,
    投保天数系数: number,
    element: CareerProperty,
    careerParamObj: CareerParamObj,

  ) => {
    careerParamObj.职业类别 = element.职业类别;
    careerParamObj.投保人数 = element.投保人数;
    careerParamObj.意外身故_万元 = element.意外身故_万元;
    careerParamObj.意外伤残_万元 = element.意外伤残_万元;
    careerParamObj.附加意外伤害医疗_万元 = element.附加意外伤害医疗_万元;

    careerParamObj.住院津贴_元 = element.住院津贴_元;
    (careerParamObj.驾驶或乘坐非营运性质的机动车_万元 =
      element.驾驶或乘坐非营运性质的机动车_万元);
    (careerParamObj.乘坐客运机动车_万元 = element.乘坐客运机动车_万元);
    (careerParamObj.乘坐客运轨道交通车辆_万元 =
      element.乘坐客运轨道交通车辆_万元);
    (careerParamObj.乘坐客运轮船_万元 = element.乘坐客运轮船_万元);
    (careerParamObj.乘坐客运民航班机_万元 = element.乘坐客运民航班机_万元);
    (careerParamObj.救护车费用_万元 = element.救护车费用_万元);

    careerParamObj.身故保费 =
      element.意外身故_万元 *
      (careerParamObj?.固定系数 * careerParamObj?.身故占比);

    careerParamObj.伤残保费 =
      element.意外身故_万元 *
      (careerParamObj?.固定系数 * careerParamObj?.伤残占比);

    careerParamObj.医疗折扣系数 =
      element.附加意外伤害医疗_万元 > 8
        ? 4.9 / element.附加意外伤害医疗_万元 + 0.2
        : element.附加意外伤害医疗_万元 > 7
          ? 4.2 / element.附加意外伤害医疗_万元 + 0.3
          : element.附加意外伤害医疗_万元 > 6
            ? 2.7 / element.附加意外伤害医疗_万元 + 0.5
            : element.附加意外伤害医疗_万元 > 5
              ? 1.5 / element.附加意外伤害医疗_万元 + 0.7
              : 1;
    careerParamObj.医疗保费 =
      element.附加意外伤害医疗_万元 *
      careerParamObj.医疗系数 *
      careerParamObj.医疗折扣系数 *
      意外医疗扣除赔付比例;

    careerParamObj.住院津贴保费 =
      element.住院津贴_元 *
      careerParamObj.住院津贴系数 *
      careerParamObj.住院津贴系数折扣 *
      住院津贴免赔天数;

    careerParamObj.猝死附加 =
      (猝死保额单列 == "undefined"
        ? element.意外身故_万元
        : Number(猝死保额单列)) * careerParamObj.猝死系数;
    careerParamObj.猝死保费 =
      careerParamObj.猝死系数 *
      careerParamObj.猝死附加 *
      Number(工种选择);

    careerParamObj.风险保费合计 =
      careerParamObj.身故保费 +
      careerParamObj.伤残保费 +
      careerParamObj.医疗保费 +
      careerParamObj.住院津贴保费 +
      careerParamObj.猝死保费;

    careerParamObj.主险基准保费 =
      (careerParamObj.风险保费合计 / 风险保费固定系数) *
      投保天数系数 *
      (careerParamObj.历史赔付系数 *
        careerParamObj.企业管理系数 *
        careerParamObj.关联业务 *
        careerParamObj.地区系数 *
        careerParamObj.人员自主核保系数_关联p13);

    careerParamObj.过程保费 =
      (element.投保人数 < 20
        ? 1.2
        : element.投保人数 <= 100
          ? 1
          : 0.8) *
      element.投保人数 *
      careerParamObj.主险基准保费;

    careerParamObj.整体保费 =
      (element.投保人数 < 20
        ? 1.2
        : element.投保人数 <= 100
          ? 1
          : 0.8) *
      element.投保人数 *
      (element.投保人数 == 0
        ? 0
        : careerParamObj.主险基准保费 * careerParamObj.人数系数) *
      1.25;

    careerParamObj.主险保费_每人 =
      element.投保人数 == 0
        ? 0
        : careerParamObj.整体保费 / element.投保人数;

    careerParamObj.附加险保费_每人 =
      element.驾驶或乘坐非营运性质的机动车_万元 * 0.53 +
      element.乘坐客运机动车_万元 * 0.23 +
      element.乘坐客运轨道交通车辆_万元 * 0.08 +
      element.乘坐客运轮船_万元 * 0.09 +
      element.乘坐客运民航班机_万元 * 0.07 +
      element.救护车费用_万元 * 40;

    careerParamObj.总保费 =
      (careerParamObj.主险保费_每人 +
        careerParamObj.附加险保费_每人) *
      element.投保人数;

  };

  return (
    <>
      <ComContent title="团体意外险报价器" />
      <div
        style={{
          paddingLeft: "10px",
          paddingRight: "10px",
          height: screenHeight,
          overflowY: "auto",
          // border: "1px solid red",
        }}
      >
        <ProForm
          submitter={{
            render: () => {
              return [];
            },
          }}
          onValuesChange={(_, values) => {
            setBasicParam((prev) => ({
              ...prev,
              ...values,
            }));
            let total = 0;
            const result: CareerParamObj[] = [];
            values.工种选择 = values.工种选择?.split("_")[1];
            values.careerDetailList.forEach((element: CareerProperty) => {
              const careerParamObj: CareerParamObj | undefined = 职业类别选项.find(
                (item) => item.value === element.职业类别,
              );
              if (careerParamObj) {
                costCalculation(
                  values.工种选择,
                  values.猝死保额单列,
                  values.意外医疗扣除赔付比例,
                  values.住院津贴免赔天数,
                  getDayValueByInput(values.投保天数),
                  element,
                  careerParamObj,

                );

                if (careerParamObj.总保费 && careerParamObj.总保费 > 0) {
                  total = total + careerParamObj.总保费;
                }
                result.push(careerParamObj);
              }
            })
            setOverallAverage(total);
            setCareerResult(result);
          }}



          initialValues={basicParam}
          onFinish={async (values) => {
            console.log(values);
          }}
        >
          <Flex vertical>
            <ProCard
              style={{
                marginBlockEnd: 10,
                // backgroundColor: "#eef8ff",
                borderRadius: "8px",
              }}
              bordered
              headerBordered
              collapsible
              title="投保报价公共配置"
            >
              <ProFormText
                name="投保人"
                label="投保人"
                allowClear
                placeholder="请输入投保人名称"
              />

              <ProFormSelect
                name="工种选择"
                label="工种选择"
                allowClear={false}
                rules={[
                  {
                    required: true,
                  },
                ]}
                options={工种选择选项}
                placeholder="请选择"
                onChange={(value) => {
                  if (value === '4_1' || value === '5_1') {
                    setCareerTypeList(
                      职业类别选项.filter((item) => item.label === '五类' || item.label === '六类')
                    );
                  } else {
                    setCareerTypeList(职业类别选项);
                  }
                }}


              />
              <ProFormSelect
                name="猝死保额单列"
                label="猝死保额单列"
                allowClear={false}
                rules={[
                  {
                    required: true,
                  },
                ]}
                options={猝死保额单列选项}
                placeholder="请选择"
              />

              <ProFormSelect
                name="意外医疗扣除赔付比例"
                label="意外医疗扣除赔付比例"
                allowClear={false}
                rules={[
                  {
                    required: true,
                  },
                ]}
                options={意外医疗扣除赔付比例选项}
                placeholder="请选择"
              />
              <ProFormSelect
                name="住院津贴免赔天数"
                label="住院津贴免赔天数"
                allowClear={false}
                rules={[
                  {
                    required: true,
                  },
                ]}
                options={住院津贴免赔天数选项}
                placeholder="请选择"
              />
              <ProFormDigit
                tooltip={"不能超过365天"}
                label="投保天数"
                name="投保天数"
                placeholder="请输入"
                min={1}
                max={365}
                fieldProps={{
                  precision: 0,
                  suffix: <span style={{ color: "#a1a1a1" }}>天</span>,
                }}
                rules={[{ required: true }]}
              />
            </ProCard>

            <ProFormDependency
              key="BasicDetailDependency"
              name={[
                '工种选择',
                '猝死保额单列',
                '意外医疗扣除赔付比例',
                '住院津贴免赔天数',
                '投保天数',
                '投保人',
              ]}
            >
              {({
                工种选择,
                猝死保额单列,
                意外医疗扣除赔付比例,
                住院津贴免赔天数,
                投保天数,

              }) => {
                // 数据预处理
                工种选择 = 工种选择?.split("_")[1];
                return (
                  <>
                    <ProFormList
                      name="careerDetailList"
                      creatorButtonProps={{
                        creatorButtonText: "增加其他职业类别",
                      }}
                      min={1}
                      max={职业类别选项.length}
                      alwaysShowItemLabel
                      actionRef={careerDetailListRef}
                      onAfterRemove={() => {
                        setCareerTypeList(
                          getDifferenceByProperty(
                            职业类别选项,
                            careerDetailListRef.current?.getList(),
                            "label",
                            "职业类别",
                          ),
                        );
                      }}
                      actionGuard={{
                        beforeAddRow: async (defaultValue, insertIndex) => {
                          careerDetailListRef.current?.add({
                            驾驶或乘坐非营运性质的机动车_万元: 0,
                            乘坐客运机动车_万元: 0,
                            乘坐客运轨道交通车辆_万元: 0,
                            乘坐客运轮船_万元: 0,
                            乘坐客运民航班机_万元: 0,
                            救护车费用_万元: 0,
                            ...defaultValue,
                            职业类别: undefined,
                            意外身故_万元: undefined,
                            意外伤残_万元: undefined,
                          });
                          return new Promise((resolve) => {
                            resolve(false);
                          });
                        },
                      }}
                      itemRender={({ listDom, action }, { index, record }) => {
                        return (
                          <ProCard
                            style={{
                              marginBlockEnd: 10,
                              backgroundColor:
                                index % 2 == 0 ? "#f0f7ff" : "#f1f0ff",
                              borderRadius: "8px",
                            }}
                            bordered
                            headerBordered
                            collapsible
                            defaultCollapsed
                            extra={action}
                            title={
                              "投保报价详细配置" +
                              (index > 0
                                ? index +
                                1 +
                                (record.职业类别
                                  ? "（" + record.职业类别 + "职业）"
                                  : "")
                                : Number(
                                  careerDetailListRef.current?.getList()
                                    ?.length,
                                ) > 1
                                  ? "1" +
                                  (record.职业类别
                                    ? "（" + record.职业类别 + "职业）"
                                    : "")
                                  : "")
                            }
                          >
                            {listDom}
                          </ProCard>
                        );
                      }}
                    >
                      <ProForm.Group key="group">
                        <ProFormDependency
                          key="CareerDetailListDependency"
                          name={[
                            "职业类别",
                            "投保人数",
                            "意外身故_万元",
                            "意外伤残_万元",
                            "附加意外伤害医疗_万元",
                            "住院津贴_元",
                            "驾驶或乘坐非营运性质的机动车_万元",
                            "乘坐客运机动车_万元",
                            "乘坐客运轨道交通车辆_万元",
                            "乘坐客运轮船_万元",
                            "乘坐客运民航班机_万元",
                            "救护车费用_万元",
                          ]}
                        >
                          {({
                            职业类别,
                            投保人数,
                            意外身故_万元,
                            意外伤残_万元,
                            附加意外伤害医疗_万元,
                            住院津贴_元,
                            驾驶或乘坐非营运性质的机动车_万元,
                            乘坐客运机动车_万元,
                            乘坐客运轨道交通车辆_万元,
                            乘坐客运轮船_万元,
                            乘坐客运民航班机_万元,
                            救护车费用_万元,
                          }) => {
                            附加意外伤害医疗_万元 = 附加意外伤害医疗_万元 || 0;
                            住院津贴_元 = 住院津贴_元 || 0;
                            驾驶或乘坐非营运性质的机动车_万元 =
                              驾驶或乘坐非营运性质的机动车_万元 || 0;
                            乘坐客运机动车_万元 = 乘坐客运机动车_万元 || 0;
                            乘坐客运轨道交通车辆_万元 =
                              乘坐客运轨道交通车辆_万元 || 0;
                            乘坐客运轮船_万元 = 乘坐客运轮船_万元 || 0;
                            乘坐客运民航班机_万元 = 乘坐客运民航班机_万元 || 0;
                            救护车费用_万元 = 救护车费用_万元 || 0;


                            const careerParamObj: CareerParamObj | undefined = 职业类别选项.find(
                              (item) => item.value === 职业类别,
                            );

                            if (careerParamObj) {
                              costCalculation(
                                工种选择,
                                猝死保额单列,
                                意外医疗扣除赔付比例,
                                住院津贴免赔天数,
                                getDayValueByInput(投保天数),
                                {
                                  职业类别,
                                  投保人数,
                                  意外身故_万元,
                                  意外伤残_万元,
                                  附加意外伤害医疗_万元,
                                  住院津贴_元,
                                  驾驶或乘坐非营运性质的机动车_万元,
                                  乘坐客运机动车_万元,
                                  乘坐客运轨道交通车辆_万元,
                                  乘坐客运轮船_万元,
                                  乘坐客运民航班机_万元,
                                  救护车费用_万元,
                                },
                                careerParamObj
                              );
                            }

                            const totalAmount =

                              意外身故_万元 +
                              (附加意外伤害医疗_万元 +
                                驾驶或乘坐非营运性质的机动车_万元 +
                                乘坐客运机动车_万元 +
                                乘坐客运轨道交通车辆_万元 +
                                乘坐客运轮船_万元 +
                                乘坐客运民航班机_万元);

                            const isExceed =
                              Number(tempInputValue) > maxSingleAmount ||
                                Number(totalAmount) > maxTotalAmount
                                ? true
                                : false;

                            const limitValue =
                              isNaN(totalAmount) ||
                                Number(tempInputValue) > maxSingleAmount
                                ? maxSingleAmount
                                : maxTotalAmount -
                                (Number(totalAmount) -
                                  Number(tempInputValue));

                            const maxValue = ["五类", "六类"].includes(职业类别)
                              ? 60
                              : ["四类"].includes(职业类别)
                                ? 80
                                : 100;

                            const tooltip = 职业类别
                              ? "职业类别选择" +
                              职业类别 +
                              "时，不能超过" +
                              maxValue +
                              "万元"
                              : "请先选择职业类别";

                            return (
                              <>
                                <ProCard
                                  title="基础保额信息"
                                  collapsible
                                  style={{
                                    marginBlockEnd: 10,
                                    width: screenWidth - 50,
                                    maxWidth: "100%",
                                  }}
                                >
                                  <ProFormSelect
                                    name="职业类别"
                                    label={<>职业类别<a onClick={() => { router.push('/cm/simple-quotation/hangyeleibie') }} style={{ textDecoration: 'underline' }}>（职业类别信息查询）</a></>}
                                    allowClear={false}
                                    rules={[
                                      {
                                        required: true,
                                      },
                                    ]}
                                    options={careerTypeList}
                                    onChange={() => {
                                      setCareerTypeList(
                                        getDifferenceByProperty(
                                          职业类别选项,
                                          careerDetailListRef.current?.getList(),
                                          "label",
                                          "职业类别",
                                        ),
                                      );
                                    }}
                                    placeholder="请选择"
                                  />

                                  <ProFormDigit
                                    label="投保人数"
                                    name="投保人数"
                                    placeholder="请输入"
                                    min={1}
                                    max={100000}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          人
                                        </span>
                                      ),
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                  <ProFormDigit
                                    tooltip={tooltip}
                                    label="意外身故/意外伤残"
                                    name="意外身故_万元"
                                    placeholder="请输入"
                                    min={1}
                                    max={isExceed ? limitValue : maxValue}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                      onChange(value) {
                                        setTempInputValue(value);
                                      },
                                    }}
                                    rules={[{ required: true }]}
                                  />

                                  <ProFormDigit
                                    label="附加意外伤害医疗"
                                    name="附加意外伤害医疗_万元"
                                    placeholder="请输入"
                                    min={0}
                                    max={isExceed ? limitValue : undefined}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                      onChange(value) {
                                        setTempInputValue(value);
                                      },
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                  <ProFormDigit
                                    tooltip={"不能超过300元"}
                                    label="附加意外伤害住院津贴"
                                    name="住院津贴_元"
                                    placeholder="请输入"
                                    min={0}
                                    max={300}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          元
                                        </span>
                                      ),
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                </ProCard>

                                <ProCard
                                  title="附加保额信息"
                                  collapsible
                                  defaultCollapsed
                                  style={{
                                    marginBlockEnd: 10,
                                    width: screenWidth - 50,
                                    maxWidth: "100%",
                                  }}
                                >
                                  <ProFormDigit
                                    tooltip={"不能超过30万元"}
                                    label="驾驶或乘坐非营运性质的机动车"
                                    name="驾驶或乘坐非营运性质的机动车_万元"
                                    placeholder="请输入"
                                    min={0}
                                    max={isExceed ? limitValue : 30}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                      onChange(value) {
                                        setTempInputValue(value);
                                      },
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                  <ProFormDigit
                                    tooltip={"不能超过30万元"}
                                    label="乘坐客运机动车"
                                    name="乘坐客运机动车_万元"
                                    placeholder="请输入"
                                    min={0}
                                    max={isExceed ? limitValue : 30}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                      onChange(value) {
                                        setTempInputValue(value);
                                      },
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                  <ProFormDigit
                                    tooltip={"不能超过200万元"}
                                    label="乘坐客运轨道交通车辆"
                                    name="乘坐客运轨道交通车辆_万元"
                                    placeholder="请输入"
                                    min={0}
                                    max={isExceed ? limitValue : 200}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                      onChange(value) {
                                        setTempInputValue(value);
                                      },
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                  <ProFormDigit
                                    tooltip={"不能超过100万元"}
                                    label="乘坐客运轮船"
                                    name="乘坐客运轮船_万元"
                                    placeholder="请输入"
                                    min={0}
                                    max={isExceed ? limitValue : 100}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                      onChange(value) {
                                        setTempInputValue(value);
                                      },
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                  <ProFormDigit
                                    tooltip={"不能超过200万元"}
                                    label="乘坐客运民航班机"
                                    name="乘坐客运民航班机_万元"
                                    placeholder="请输入"
                                    min={0}
                                    max={isExceed ? limitValue : 200}
                                    fieldProps={{
                                      precision: 0,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                      onChange(value) {
                                        setTempInputValue(value);
                                      },
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                  <ProFormDigit
                                    tooltip={"不能超过1万元"}
                                    label="救护车费用"
                                    name="救护车费用_万元"
                                    placeholder="请输入"
                                    min={0}
                                    max={1}
                                    fieldProps={{
                                      precision: 1,
                                      suffix: (
                                        <span style={{ color: "#a1a1a1" }}>
                                          万元
                                        </span>
                                      ),
                                    }}
                                    rules={[{ required: true }]}
                                  />
                                </ProCard>

                                <ProCard
                                  title="计算结果内容"
                                  collapsible
                                  style={{
                                    marginBlockEnd: 10,
                                    width: screenWidth - 50,
                                    maxWidth: "100%",
                                  }}
                                >




                                  <Statistic
                                    value={careerParamObj?.主险保费_每人}
                                    precision={2}
                                    valueStyle={{
                                      fontSize: 15,
                                    }}
                                    prefix="主险保费（每人）："
                                    suffix="元"
                                  />
                                  <Statistic
                                    value={careerParamObj?.附加险保费_每人}
                                    precision={2}
                                    valueStyle={{
                                      fontSize: 15,
                                    }}
                                    prefix="附加险保费（每人）："
                                    suffix="元"
                                  />
                                  {/* <br /> */}
                                  <Statistic
                                    value={careerParamObj?.总保费}
                                    precision={2}
                                    valueStyle={{
                                      fontSize: 16,
                                      color: "#3a7800",
                                    }}
                                    prefix={
                                      (职业类别 ? 职业类别 + "职业" : "") +
                                      "总保费："
                                    }
                                    suffix="元"
                                  />
                                </ProCard>
                              </>
                            );
                          }}
                        </ProFormDependency>
                      </ProForm.Group>
                    </ProFormList>
                  </>
                );
              }}
            </ProFormDependency>
          </Flex>
        </ProForm>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          height: 40,
          display: "flex",
          justifyContent: "space-between",
          textAlign: "center",
          backgroundColor: "#f0f7ff",
          // border: "1px solid #186bb4",
        }}
      >
        <Statistic
          style={{
            width: "65%",
          }}
          value={overallAverage}
          precision={0}
          valueStyle={{
            fontSize: 22,
            color: "red",
          }}
          prefix={
            <span
              style={{
                color: "#000",
                fontSize: 14,
              }}
            >
              总保费
            </span>
          }
          suffix={
            <span
              style={{
                color: "#000",
                fontSize: 14,
              }}
            >
              元
            </span>
          }
        />

        <div
          style={{
            width: "35%",
            backgroundColor: "#186bb4",
            height: 40,
            color: "#FFF",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => {
            if (careerResult.length > 0 && overallAverage > 0) {
              setOpenPreview(true)
              if (qywxUserInfo) {
                insertQuickQuotationRecord({
                  insurance_customer: basicParam.投保人,
                  insurance_type: '团体意外险报价',
                  quotation_info: JSON.stringify(careerResult),
                  p13_uid: qywxUserInfo.P13UID,
                  staff_code: qywxUserInfo.STAFF_CODE,
                  staff_name: qywxUserInfo.STAFF_NAME,
                  department_code: qywxUserInfo.DEPARTMENT_CODE,
                  department_group_code: qywxUserInfo.DEPARTMENT_GROUP_CODE,
                })
              }
            } else {
              message.warning(
                "请输入或选择必要参数项！",
              );
            }
          }}
        >
          报价预览
        </div>
      </div>
      <Drawer
        style={{ borderRadius: '10px 10px 0 0' }}
        title={<Statistic
          value={overallAverage}
          precision={0}
          valueStyle={{
            fontSize: 22,
            color: "red",
          }}
          prefix={
            <span
              style={{
                color: "#000",
                fontSize: 14,
              }}
            >
              总保费
            </span>
          }
          suffix={
            <span
              style={{
                color: "#000",
                fontSize: 14,
              }}
            >
              元
            </span>
          }
        />}
        placement={"bottom"}
        closable={false}
        open={openPreview}
        height={screenHeight}
        extra={
          <Button type="link" onClick={() => {
            setOpenPreview(false)
          }}>
            关闭
          </Button>
        }
      >
        <ProCard title="投保公共配置·" style={{ marginBottom: 16 }}>
          {basicParam.投保人 && (
            <Statistic
              value={basicParam.投保人}
              valueStyle={{ fontSize: 14 }}
              prefix="投保人："
            />
          )}

          <Statistic
            value={
              猝死保额单列选项.find(
                (item) => item.value === basicParam.猝死保额单列
              )?.label
            }
            valueStyle={{ fontSize: 14 }}
            prefix="猝死保额单列："
          />
          <Statistic
            value={
              意外医疗扣除赔付比例选项.find(
                (item) => item.value === basicParam.意外医疗扣除赔付比例
              )?.label
            }
            valueStyle={{ fontSize: 14 }}
            prefix="意外医疗扣除赔付比例："
          />
          <Statistic
            value={
              住院津贴免赔天数选项.find(
                (item) => item.value === basicParam.住院津贴免赔天数
              )?.label
            }
            valueStyle={{ fontSize: 14 }}
            prefix="住院津贴免赔天数："
          />

          <Statistic
            value={basicParam.投保天数}
            valueStyle={{ fontSize: 14 }}
            prefix="投保天数："
            suffix="天"
          />
        </ProCard>

        <ProCard title="基础保额信息" style={{ marginTop: 16 }}>
          {careerResult && careerResult.length > 0
            ? careerResult.map((item, index) => (
              <div key={index}>
                {item['职业类别'] && (
                  <Statistic
                    value={item['职业类别']}
                    valueStyle={{ fontSize: 14 }}
                    prefix="职业类别："
                  />
                )}
                {item['投保人数'] !== undefined && item['投保人数'] > 0 && (
                  <Statistic
                    value={item['投保人数']}
                    valueStyle={{ fontSize: 14 }}
                    prefix="投保人数："
                    suffix="人"
                  />
                )}
                {item['意外身故_万元'] !== undefined &&
                  item['意外身故_万元'] > 0 && (
                    <Statistic
                      value={item['意外身故_万元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="意外身故/意外伤残："
                      suffix="万元"
                    />
                  )}
                {item['附加意外伤害医疗_万元'] !== undefined &&
                  item['附加意外伤害医疗_万元'] > 0 && (
                    <Statistic
                      value={item['附加意外伤害医疗_万元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="附加意外伤害医疗："
                      suffix="万元"
                    />
                  )}

                {item['住院津贴_元'] !== undefined &&
                  item['住院津贴_元'] > 0 && (
                    <Statistic
                      value={item['住院津贴_元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="住院津贴："
                      suffix="元"
                    />
                  )}

                {item['驾驶或乘坐非营运性质的机动车_万元'] !== undefined &&
                  item['驾驶或乘坐非营运性质的机动车_万元'] > 0 && (
                    <Statistic
                      value={item['驾驶或乘坐非营运性质的机动车_万元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="驾驶或乘坐非营运性质的机动车："
                      suffix="万元"
                    />
                  )}
                {item['乘坐客运机动车_万元'] !== undefined &&
                  item['乘坐客运机动车_万元'] > 0 && (
                    <Statistic
                      value={item['乘坐客运机动车_万元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="乘坐客运机动车："
                      suffix="万元"
                    />
                  )}
                {item['乘坐客运轨道交通车辆_万元'] !== undefined &&
                  item['乘坐客运轨道交通车辆_万元'] > 0 && (
                    <Statistic
                      value={item['乘坐客运轨道交通车辆_万元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="乘坐客运轨道交通车辆："
                      suffix="万元"
                    />
                  )}
                {item['乘坐客运轮船_万元'] !== undefined &&
                  item['乘坐客运轮船_万元'] > 0 && (
                    <Statistic
                      value={item['乘坐客运轮船_万元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="乘坐客运轮船："
                      suffix="万元"
                    />
                  )}
                {item['乘坐客运民航班机_万元'] !== undefined &&
                  item['乘坐客运民航班机_万元'] > 0 && (
                    <Statistic
                      value={item['乘坐客运民航班机_万元']}
                      precision={0}
                      valueStyle={{ fontSize: 14 }}
                      prefix="乘坐客运民航班机："
                      suffix="万元"
                    />
                  )}
                {item['救护车费用_万元'] !== undefined &&
                  item['救护车费用_万元'] > 0 && (
                    <Statistic
                      value={item['救护车费用_万元']}
                      precision={1}
                      valueStyle={{ fontSize: 14 }}
                      prefix="救护车费用："
                      suffix="万元"
                    />
                  )}

                {item['主险保费_每人'] !== undefined &&
                  item['主险保费_每人'] > 0 && (
                    <Statistic
                      value={item['主险保费_每人']}
                      precision={2}
                      valueStyle={{ fontSize: 14 }}
                      prefix="主险保费（每人）："
                      suffix="元"
                    />
                  )}

                {item['总保费'] !== undefined && item['总保费'] > 0 && (
                  <Statistic
                    value={item['总保费']}
                    precision={2}
                    valueStyle={{ fontSize: 14, color: '#3a7800' }}
                    prefix={
                      item['职业类别']
                        ? `${item['职业类别']}职业总保费：`
                        : '总保费：'
                    }
                    suffix="元"
                  />
                )}
              </div>
            ))
            : null}
        </ProCard>
        <ProCard style={{ marginBottom: 16 }}>
          <Statistic
            value={overallAverage}
            precision={0}
            valueStyle={{
              fontSize: 22,
              color: 'red',
            }}
            prefix={
              <span
                style={{
                  color: '#000',
                  fontSize: 14,

                }}
              >
                总保费
              </span>
            }
            suffix="元"
          />
        </ProCard>

      </Drawer>
    </>
  );
}
export default dynamic(() => Promise.resolve(Home), { ssr: false });

