## 이걸 굳이 알아야하나...?

깃허브에도 이미 만들어놓은 starter가 많고,
vue.js나 react도 어느정도 이미 구성이 되어있다.

자율주행자동차 → 일본으로 가서 방향을 반대로 바꿔야 한다면...? 🙂
(정비소에 맡겨도 되지만, 만약 내가 직접 할줄 안다면...?)

개발로 돌아와서 CRA, vue-cli, ...시간이 지나고 상황이 변해서 개발세팅을 변경해야 한다면...?

엔지니어라면 사용하는 도구를 자유자재로 다루는 것도 또 하나의 "능력".

<br />

### 프런트엔드 개발에 Node.js가 필요한 이유.

- 최신 스펙으로 개발할 수 있다.

  - eg. 바벨, 웹팩, npm

- 빌드 자동화

  - 파일 압축
  - 코드 난독화
  - 폴리필
  - 라이브러리 의존성을 해결
  - 각종 테스트를 자동화
  - ...

- 개발 환경 커스터마이징
  - CRA, vue-cli, ...

<br />

### loader 실습

```js
module.exports = function myloader(content) {
  console.log("myloader가 동작함");
  // return content;
  return content.replace("console.log(", "alert("); // console.log( -> alert( 로 치환
};
```

```js
// webpack.config.js
module: {
  rules: [{
    test: /\.js$/, // .js 확장자로 끝나는 모든 파일
    use: [path.resolve('./myloader.js')] // 방금 만든 로더를 적용한다
  }],
}
```

<br />

### 자주 사용하는 로더

> `style-loader`, `css-loader`, `file-loader`, `url-loader`

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"], // style-loader를 앞에 추가한다
      },
      {
        test: /\.png$/, // .png 확장자로 마치는 모든 파일
        loader: "file-loader",
        options: {
          publicPath: "./dist/", // prefix를 아웃풋 경로로 지정
          name: "[name].[ext]?[hash]", // 파일명 형식
        },
      },
      {
        test: /\.png$/,
        use: {
          loader: "url-loader", // url 로더를 설정한다
          options: {
            publicPath: "./dist/", // file-loader와 동일
            name: "[name].[ext]?[hash]", // file-loader와 동일
            limit: 5000, // 5kb 미만 파일만 data url로 처리
          },
        },
      },
    ],
  },
};
```

<br />

## 플러그인

로더가 파일 단위로 처리하는 반면 플러그인은 번들된 결과물을 처리한다.

<br />

### 커스텀 플러그인

```js
// my-plugin.js
class MyPlugin {
  apply(compiler) {
    compiler.hooks.done.tap("My Plugin", stats => {
      console.log("MyPlugin: done"); // 로그를 확인해보면 한 번만 찍히는 걸 확인할 수 있다. module이 '파일 하나' 혹은 '여러 개'에 대해 동작하는 반면, 번들링된 결과물을 대상으로 동작한다.
    }

    // 어떻게 번들 결과에 접근할 수 있는 방법.
    // compiler.plugin() 함수로 후처리한다.
    // compiler.plugin() 함수의 두 번째 인자 콜백함수는 emit 이벤트가 발생하면 실행되는 녀석으로 보인다. 번들된 결과가 'compilation 객체'에 들어 있는데, compilation.assets['main.js'].source() 함수로 접근할 수 있다.
    compiler.plugin('emit', (compilation, callback) => {
      const source = compilation.assets['main.js'].source();
      console.log(source);
      callback();
    })
  }
}

module.exports = MyPlugin
```

> 웹팩 내장 플러그인 [BannerPlugin 코드](https://github.com/lcxfs1991/banner-webpack-plugin/blob/master/index.js) 참고.

<br />

### `compilation`을 이용한 배너를 추가한 플러그인

```js
class MyPlugin {
  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      const source = compilation.assets['main.js'].source();

      compilation.assets['main.js'].source = () => {
        const banner = [
          '/**',
          ' * 이것은 BannerPlugin이 처리한 결과입니다.',
          ' * Build Date: 2022-11-15',
          ' */'
          ''
        ].join('\n');
        return banner + '\n' + source;
      }

      callback();
    })
  }
}
```

<br />

### 자주 사용하는 플러그인

#### `webpack.BannerPlugin`

```js
// webpack.config.js
const webpack = require("webpack");

module.exports = {
  plugins: [
    new webpack.BannerPlugin({
      banner: "배너입니다",
    }),
  ],
};
```

생성자 함수에 전달하는 옵션 객체의 banner 속성에 문자열을 전달한다.<br />
'웹팩 컴파일 타임'에 얻을 수 있는 정보, 가령 빌드 시간이나 커밋 정보를 전달하기위해 함수로 전달할 수도 있다.<br />

```js
new webpack.BannerPlugin({
  banner: () => `빌드 날짜: ${new Date().toLocalString()}`,
});
```

배너 정보가 많다면 별도 파일로 분리하자.

```js
const banner = require("./banner.js");

new webpack.BannerPlugin(banner);
```

다른 정보들도 추가해보자.

```js
// banner.js
const childProcess = require("child_process");

module.exports = function banner() {
  const commit = childProcess.execSync("git rev-parse --short HEAD");
  const user = childProcess.execSync("git config user.name");
  const date = new Date().toLocaleString();

  return (
    `commitVersion: ${commit}` + `Build Date: ${date}\n` + `Author: ${user}`
  );
};
```

> 배포했을 때, 잘 배포됐는지 캐시에 의해서 갱신이 안되고 있는건 아닌지 확인할 때 사용한다.

<br />

### `webpack.DefinePlugin`

애플리케이션은 개발환경과 운영환경으로 나눠서 운영한다.<br />
가령 환경에 따라 API 서버 주소가 다를 수 있다.<br />
'같은 소스 코드'를 '2가지 다른 환경'에 배포하기 위해서는 이러한 '환경 의존적인 정보'를 소스가 아닌 곳에서 관리하는 것이 좋다. 배포할 때마다 코드를 수정하는 것은 곤란하기 때문이다.

```js
// webpack.config.js
const webpack = require("webpack");

export default {
  plugins: [new webpack.DefinePlugin({})],
};
```

빈 객체를 전달해도 기본적으로 넣어주는 값이 있다.<br />
노드 환경정보인 `process.env.NODE_ENV`인데, 웹팩 설정의 mode에 설정한 값이 여기에 들어간다.<br />
`"development"`를 설정했기 때문에 애플리케이션 코드에서 `process.env.NODE_ENV` 변수로 접근하면 `"development"`값을 얻을 수 있다.

```js
console.log(process.env.NODE_ENV); // "development"
```

이 외에도 '웹팩 컴파일 시간'에 결정되는 값을 '전역 상수 문자열'로 애플리케이션에 주입할 수도 있다.

```js
new webpack.DefinePlugin({
  TWO: "1+1",
});
```

`TWO`라는 전역 변수에 `1+1`이란 코드 조각을 넣었다. 실제 애플리케이션 코드에서 이것을 출력해보면 2가 나올 것이다.

```js
console.log(TWO); // 2
```

코드가 아닌 값을 입력하려면 문자열화 한 뒤 넘긴다.

```js
new webpack.DefinePlugin({
  VERSION: JSON.stringify("v.1.2.3"),
  PRODUCTION: JSON.stringify(false),
  MAX_COUNT: JSON.stringify(999),
  "api.domain": JSON.stringify("http://dev.api.domain.com"),
});
```

```js
console.log(VERSION); // 'v.1.2.3'
console.log(PRODUCTION); // true
console.log(MAX_COUNT); // 999
console.log(api.domain); // 'http://dev.api.domain.com'
```

빌드 타임에 결정된 값을 애플리케이션에 전달하고 싶을 때는 이 플러그인을 사용하자. :)

<br />

#### `HtmlWebpackPlugin`

> webpack 내장이 아닌 써드 파티 패키지. [https://github.com/jantimon/html-webpack-plugin/](https://github.com/jantimon/html-webpack-plugin/)

HTML 파일을 후처리하는데 사용한다. '빌드 타임의 값'을 넣거나 '코드를 압축'할 수 있다.

```
npm install -D html-webpack-plugin
```

이 플러그인으로 빌드하면 HTML파일로 아웃풋에 생성될 것이다.<br />
index.html 파일을 src/index.html로 옮긴 뒤 다음과 같이 작성해보자.

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>타이틀<%= env %></title>
  </head>
  <body>
    <!-- 로딩 스크립트 제거 -->
    <!-- <script src="dist/main.js"></script> -->
  </body>
</html>
```

타이틀 부분에 'ejs 문법'을 이용하는데 `<%= env %>`는 전달받은 env 변수 값을 출력한다.<br />
`HtmlWebpackPlugin`은 이 변수에 데이터를 주입시켜 동적으로 HTML 코드를 생성한다.<br />

뿐만 아니라 웹팩으로 빌드한 결과물을 자동으로 로딩하는 코드를 주입해준다.<br />
때문에 스크립트 로딩 코드도 제거했다.<br />

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports {
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // 템플릿 경로를 지정
      templateParameters: { // 템플릿에 주입할 파라미터 변수 지정
        env: process.env.NODE_ENV == 'development' ? '(개발용)' : '',
      },
    })
  ]
}
```

'환경 변수'에 따라 타이틀 명 뒤에 "(개발용)" 문자열을 붙이거나 떼도록 했다.<br />
`NODE_ENV=development`로 설정해서 빌드하면 빌드결과가 "타이틀(개발용)"으로 나온다.<br />
`NODE_ENV=production`으로 설정해서 빌드하면 빌드결과가 "타이틀"로 나온다.

개발환경과 달리 운영 환경에서는 '파일을 압축'하고 '불필요한 주석을 제거'하는 것이 좋다.<br />

```js
// webpack.config.js
new HtmlWebpackPlugin({
  minify:
    process.env.NODE_ENV === "production"
      ? {
          collapseWhitespace: true, // 빈칸 제거
          removeComments: true, // 주석 제거
        }
      : false,
});
```

> [minify 옵션이 웹팩 버전 3 기준으로 되어 있다.](https://github.com/jantimon/html-webpack-plugin/issues/1094)

환경변수에 따라 minify 옵션을 켰다. `NODE_ENV=production npm run build`로 빌드하면 아래처럼 코드가 압축된다. 물론 주석도 제거 되었다.<br />

정적파일을 배포하면 즉각 브라우저에 반영되지 않는 경우가 있다. 브라우저 캐쉬가 원인일 경우가 있는데, 이를 위한 예방 옵션도 있다.

```js
new HtmlWebpackPlugin({
  hash: true, // 정적 파일을 불러올 때, 쿼리문자열에 웹팩 해시값을 추가한다.
});
```

`hash: true` 옵션을 추가하면 빌드할 시 생성하는 해시값을 '정적파일 로딩 주소'에 '쿼리 문자열(ex. ?808fae0e1e88...)'로 붙여서 HTML을 생성한다.

<br />

#### `CleanWebpackPlugin`

> [https://github.com/johnagan/clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)

빌드 결과물을 제거하는 플러그인이다.<br />

빌드 결과물은 아웃풋 경로에 모이는데 과거 파일이 남아 있을 수 있다.<br />
이전 빌드내용이 '덮여 씌여지면' 상관없지만, 그렇지 않으면 아웃풋 폴더에 여전히 남아 있을 수 있다.<br />

플러그인을 설치하고,<br />

```
npm i -D clean-webpack-plugin
```

웹팩 설정을 추가한다. <br />

```js
// webpack.config.js
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  plugins: [new CleanWebpackPlugin()],
};
```

<br />

#### `MiniCssExtractPlugin`

> [https://github.com/webpack-contrib/mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)

MiniCssExtractPlugin은 CSS를 별도 파일로 뽑아내는 플러그인이다.<br />

스타일시트가 점점 많아지면 하나의 자바스크립트 결과물로 만드는 것이 부담일 수 있다.<br />
번들 결과에서 스타일시트 코드만 뽑아서 별도의 CSS 파일로 만들어 역할에 따라 파일을 분리하는 것이 좋다.<br />
브라우저에서 큰 파일 하나를 내려받는 것보다, 여러 개의 작은 파일을 동시에 다운로드하는 것이 더 빠르다.<br />

개발 환경에서는 CSS를 하나의 모듈로 처리해도 상관없지만, 프로덕션 환경에서는 분리하는 것이 효과적이다.<br />

```
npm i -D mini-css-extract-plugin
```

```js
// webpack.config.js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [
    ...(process.env.NODE_ENV === "production"
      ? [new MiniCssExtractPlugin({ filename: `[name].css` })]
      : []),
  ],
};
```

프로덕션 환경일 경우만 이 플러그인을 추가했다.<br />
`filename`에 설정한 값으로 아웃풋 경로에 CSS파일이 생성될 것이다.<br />

개발 환경에서는 `css-loader`에 의해 자바스크립트 모듈로 변경된 스타일시트를 '적용'하기 위해서 `style-loader`를 사용했다. 반면, 프로덕션 환경에서는 별도의 CSS 파일로 추출하는 플러그인을 적용했으므로 다른 로더가 필요하다.(`MiniCssExtractPlugin.loader`)<br />

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          process.env.NODE_ENV === "production"
            ? MiniCssExtractPlugin.loader // 프로덕션 환경
            : "style-loader", // 개발 환경
          "css-loader",
        ],
      },
    ],
  },
};
```

플러그인에서 제공하는 MiniCssExtractPlugin.loader 로더를 추가한다.<br />

`NODE_ENV=production npm run build`로 결과를 확인해보자.<br />
dist/mian.css가 생성되었고, index.html에 이 파일을 로딩하는 코드가 추가되었다.

<br />

### 정리

ECMAScript2015 이전에는 모듈을 만들기 위해 '즉시실행함수'와 '네임스페이스 패턴'을 사용했다.<br />
이후 각 커뮤니티에서 모듈 시스템 스펙이 나왔고, 웹팩은 ECMAScript2015 모듈시스템을 쉽게 사용하도록 돕는 역할을 한다.<br />

엔트리포인트를 시작으로, 연결되어 있는 모든 모듈을 하나로 합쳐서 결과물을 만드는 것이 웹팩의 역할이다.<br />
자바스크립트 모듈 뿐만 아니라 스타일시트, 이미지 파일까지도 모듈로 제공해주기 때문에 일관적으로 개발할 수 있다.<br />

웹팩의 '로더'와 '플러그인'의 '원리'에 대해 살펴보았고 자주 사용하는 것들의 기본적인 사용법에 대해 익혔다.
