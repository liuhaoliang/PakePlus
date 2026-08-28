package com.example.helloworld;

/**
 * HelloWorld 示例类。
 * <p>
 * 提供获取问候语与程序入口能力，作为 Java 工程最小可运行示例。
 *
 * @author DTCoder
 */
public class HelloWorld {

    /** 默认问候语常量。 */
    public static final String DEFAULT_GREETING = "Hello, World!";

    /**
     * 获取默认问候语。
     *
     * @return 默认问候字符串
     */
    public String getGreeting() {
        return DEFAULT_GREETING;
    }

    /**
     * 程序入口：向标准输出打印问候语。
     *
     * @param args 启动参数（未使用）
     */
    public static void main(String[] args) {
        HelloWorld helloWorld = new HelloWorld();
        System.out.println(helloWorld.getGreeting());
    }
}
