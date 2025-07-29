# 🤝 Contributing to tsnative

Thank you for your interest in the project! We welcome any kind of contributions — whether it's code, documentation, tests, or suggestions.

---

## ⚙️ Requirements

Before getting started, make sure you have the following installed:

- Linux
- GCC 9+
- Node.js 16.x
- Python 3.11 + Conan 1.52
- CMake 3.20+

---

## 🐳 Docker

```bash
docker pull ghcr.io/newcloudtechnologies/tsnative:latest
docker run -it ghcr.io/newcloudtechnologies/tsnative
```

---

## 🧪 Test Coverage

When adding new functionality, please include unit or integration tests whenever possible.  
This helps ensure that your changes don’t break existing functionality and makes code review easier.

---

## 🧑‍💻 How You Can Help

- Increase test coverage
- Add new examples or improve documentation
- Integrate CI/CD pipelines
- Add support for new platforms (macOS, Windows, etc.)

---

## 💡 Code Style

### TypeScript

- Strict mode (`strict`) is required
- Do not use `any`, `unknown`, `eval`, or `Function.bind`
- Use `interface` instead of raw objects

### C++

- C++14 or higher is used
- All public APIs must use pointers
- Exported classes must inherit from `Object` with it as the first base
- Exceptions between C++ and TS are not supported

---

## 📨 How to Submit a Pull Request

1. Fork the repository
2. Create a new branch: `git checkout -b feature/name`
3. Make your changes and commit them
4. Make sure the project builds and tests pass
5. Submit a pull request and describe what you've done

---

## 📄 License

By submitting a pull request, you agree that your code will be distributed under the project's [Apache 2.0 License](./LICENSE.txt).
