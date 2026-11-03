---
title: "The Template Method Pattern in Java"
translation_of: "2015-04-06-设计模式之模板方法(java实现)"
excerpt: "From making coffee to tracking article views: share a fixed workflow while letting subclasses fill in the details."
---

Imagine making a drink. First boil water, then brew the ingredients, pour the drink into a cup, and add condiments. Different drinks follow the same four steps. We can define a template and let each drink supply its own implementation.

Create a template class:

```java
/**
 * 模板超类
 */
public abstract class RefreshBeverage {

    public final void prepareBeverageTemplate(){
        boilWater();//帮水煮沸
        brew();//炮制饮料
        pourInCup();//倒入杯子中
        addCondiments();//加入调味料
    }

    /**
     * 公共方法,private为了限制必须要遵从模板
     */
    private void boilWater(){
        System.out.println("把水煮沸了！");
    }

    private void pourInCup(){
        System.out.println("倒入杯子中了！");
    }



    /**
     * 以下是各自子类不同的方法实现
     */
    protected abstract void brew();

    protected abstract void addCondiments();
}
```

Boiling water and pouring into a cup are common to every drink, so subclasses do not need to implement them. They implement only the steps that vary, such as brewing and adding ingredients.

Coffee:

```java
public class Coffee extends RefreshBeverage {
    @Override
    protected void brew() {
        System.out.println("炮制咖啡");
    }

    @Override
    protected void addCondiments() {
        System.out.println("加入糖让咖啡更加甜");
    }
}
```

Tea:

```java
public class Tea extends RefreshBeverage {
    @Override
    protected void brew() {
        System.out.println("倒入茶叶");
    }

    @Override
    protected void addCondiments() {
        System.out.println("加入牛奶,变成奶茶");
    }
}
```

Test both:

```java
public class Test {

    public static void  main(String ...arg){
        RefreshBeverage r1 = new Coffee();
        r1.prepareBeverageTemplate();

        RefreshBeverage r2 = new Tea();
        r2.prepareBeverageTemplate();
    }
}
```

**A real example: view counts**

That was a simple demonstration. What about a practical use case?

I needed to track several kinds of views: article views and WeChat views, stored in different fields of the same table, and views after sharing, stored in a different table. This involved two models, `Article` and `SharedRecord`.

Here is the template:

```java
public abstract class ReadNumTemplate {

    private static final Logger logger = LoggerFactory.getLogger(ReadNumTemplate.class);
    private static final long TIME = 3600000l;

    private String redisKey;
    private RedisService redisService;
    private String redisTimeKey;
    private Constant constant;
    private GenericMongoDao genericMongoDao;
    private boolean isBuild = false;

    protected void build(String redisKey,
                         RedisService redisService,
                         Constant constant,
                         GenericMongoDao genericMongoDao){
        this.redisKey = redisKey;
        this.redisService = redisService;
        this.redisTimeKey = redisKey + "_time";
        this.constant = constant;
        this.genericMongoDao = genericMongoDao;
        this.isBuild = true;
    }


    /**
     * 阅读数统一模板方法
     * @return
     */
    protected final Long addReadNum(){
        if(!isBuild){
            throw new RuntimeException("ReadNumTemplete is not build");
        }
        if (!redisService.exists(redisTimeKey)) {
            redisService.set(redisTimeKey, String.valueOf(System.currentTimeMillis()));
        }
        Long count = redisService.incr(redisKey);
        if(isSave(count)){
            saveToDb();
        }
        return syncho(count);
    }


    /**
     * 是否能保存
     * @param count
     * @return
     */
    private boolean isSave(Long count){
        return count % constant.MAX_READ_COUNT == 0 || arriveTime();
    }


    /**
     * 判断时间是否已经达到存入数据库的临界值
     * @return
     */
    private boolean arriveTime() {
        String timeValue = redisService.get(redisTimeKey);
        if (redisService.exists(redisTimeKey)) {
            long time = System.currentTimeMillis() - Long.parseLong(timeValue);
            if (time > TIME) {
                redisService.set(redisTimeKey, String.valueOf(System.currentTimeMillis()));
                logger.info(MessageFormat.format(getName() + ":{0}达到1小时，可以保存数据库", redisKey));
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * 同步方法
     */
    private Long syncho(Long redisCount) {
        Long dbCount = getDbCount();
        if (dbCount == null) {
            dbCount = 0l;
        }
        if (redisCount < dbCount) {
            redisService.set(redisKey, String.valueOf(dbCount));
        }
        if (redisCount % constant.MAX_READ_COUNT == 0) {
            return  dbCount + constant.MAX_READ_COUNT;
        } else {
            return  dbCount < redisCount ? redisCount : dbCount;
        }
    }
    private Long getRedisCount(){
        if(redisService.exists(redisKey)){
            return Long.parseLong(redisService.get(redisKey));
        }else{
            return 0L;
        }
    }

    /**
     * 异步保存到数据库
     */
    @Async
    private void saveToDb() {
        genericMongoDao.updateDefindProperty("id", getId(), getProperty(), getRedisCount());
    }

    protected abstract String getName();

    protected abstract String getId();

    protected abstract Long getDbCount();

    protected abstract String getProperty();
}
```

Please forgive the rough edges in this code. The common operations are:

1. Save view counts to the database.
2. Read view counts from Redis.
3. Decide whether to save: after 200 increments, or after the key has been in Redis for more than an hour.
4. Record the timestamp associated with the Redis key, so we can check the one-hour threshold.

Article views:

```java
public class ArticleReadNumService extends ReadNumTemplate {

    private Article article;

    private ArticleReadNumService(){}

    public static ArticleReadNumService create(Article article, RedisService redisService, Constant constant, ArticleRepository articleRepository){
        ArticleReadNumService articleReadNumService  = new ArticleReadNumService();
        articleReadNumService.article = article;
        articleReadNumService.build(constant.read_count_key + articleReadNumService.article.getId(),
                redisService, constant,articleRepository);
        return articleReadNumService;
    }


    @Override
    protected String getName() {
        return "文章阅读数";
    }

    @Override
    protected String getId() {
        return article.getId();
    }

    @Override
    protected Long getDbCount() {
        return article.getRead_num();
    }

    @Override
    protected String getProperty() {
        return "read_num";
    }

}
```

WeChat microsite views:

```java
public class WzReadNumService extends ReadNumTemplate{

    private Article article;

    public static WzReadNumService create(Article article, RedisService redisService, Constant constant,ArticleRepository articleRepository){
        WzReadNumService wzReadNumService = new WzReadNumService();
        wzReadNumService.article = article;
        String redisKey = constant.weixin_read_count_key + article.getId();
        wzReadNumService.build(redisKey, redisService, constant, articleRepository);
        return wzReadNumService;
    }

    @Override
    protected String getName() {
        return "微站阅读数";
    }

    @Override
    protected String getId() {
        return article.getId();
    }

    @Override
    protected Long getDbCount() {
        return article.getWx_read_num();
    }

    @Override
    protected String getProperty() {
        return "wx_read_num";
    }
}
```

Views after sharing:

```java
public class SharedReadNumService extends ReadNumTemplate{

    private SharedRecord sharedRecord;

    public static SharedReadNumService create(SharedRecord sharedRecord, RedisService redisService, Constant constant, SharedRecordRepository sharedRecordRepository){
        SharedReadNumService sharedReadNumService = new SharedReadNumService();
        sharedReadNumService.sharedRecord = sharedRecord;
        sharedReadNumService.build(constant.shared_read_count_key+sharedRecord.getId(),redisService,constant,sharedRecordRepository);
        return sharedReadNumService;
    }

    @Override
    protected String getName() {
        return "分享阅读数";
    }

    @Override
    protected String getId() {
        return sharedRecord.getId();
    }


    @Override
    protected Long getDbCount() {
        return sharedRecord.getReadNum().longValue();
    }

    @Override
    protected String getProperty() {
        return "shared_record";
    }
}
```

Each subclass now has very little to do, improving readability and maintainability. Private common methods limit how the template can be changed, while the abstract methods supply the model-specific details.

The part I'm least happy with is `build`, which passes the required beans into the template. I used it out of necessity; suggestions for a better approach are welcome.

That wraps up this introduction to Template Method. If you've used the pattern for another practical requirement, share it so I can learn from your experience too.
