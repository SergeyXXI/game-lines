const gulp = require("gulp");
const webpack = require("webpack");
const webpackStream = require("webpack-stream");

const dist = "dist/";

const mainSrcJs  = "main.js",
      mainDistJs = "index.js";

function js()
{
    return gulp.src(mainSrcJs)
               .pipe(webpackStream(
                   {
                        mode: "development",
                        output: { filename: mainDistJs },
                        devtool: "source-map",
                        module:
                        {
                            rules:
                            [
                                {
                                    test: /\.m?js$/,
                                    exclude: /node_modules/,                                    
                                    use:
                                    {
                                        loader: "babel-loader",
                                        options:
                                        {
                                            presets: [['@babel/preset-env']]
                                        }
                                    }
                                }
                            ]
                        }
                   }, webpack))               
               .pipe(gulp.dest(dist)); 
}

function production()
{
    return gulp.src(mainSrcJs)
               .pipe(webpackStream(
                    {
                        mode: "production",
                        output: { filename: mainDistJs },                
                        module:
                        {
                            rules:
                            [
                                {
                                    test: /\.m?js$/,                                    
                                    use:
                                    {
                                        loader: "babel-loader",
                                        options:
                                        {
                                            presets: [['@babel/preset-env']]
                                        }
                                    }
                                }
                            ]
                        }
                    }, webpack))               
               .pipe(gulp.dest(dist)); 
   
}

function watch()
{    
    gulp.watch("*.js", js);    
}

module.exports =
{
    watch, production,
    default: gulp.series(js, watch)
};