# Go - Code Layout & Directory Basics

This is four **VERY** basic examples of laying out your Go code and importing functions across several files, using Go 1.11 modules

## 1-simple
Most basic example with one main app in `cmd` which is split across two files `app.go` and `extra.go` both in the package `main`

## 2-multi-main
When you require multiple main executables both in package `main` with a `func main()` declared, they must be in separate directories

## 3-local-libs
Example of using a local library which exports one or more functions externally, and how to import them via modules. This example the library lives under top level `/pkg` directory. The library is in a package called `mylib` and is split across two source files `utils.go` and `more_utils.go`

## 3-local-libs-nested
Same as above, except the `mylibs` package and source code is nested under the level where it is called from