# 🚀 Questine (퀘스틴)

<div align="center">

![Image](https://github.com/user-attachments/assets/b290a20e-f2ee-4f9b-88ad-f0f94a6eceaa)

<img width="256" alt="Image" src="https://github.com/user-attachments/assets/03be92e5-e401-492f-b6f3-aa9af5f1ead1" />

</div>

<br />

> 목차
>
> - [🌟 개요](#-개요)
> - [🧩 서비스 주요 기능](#-서비스-주요-기능)
> - [🔧 트러블슈팅](#-트러블슈팅)
> - [📁 폴더 구조](#-폴더-구조)
> - [📄 참고 자료](#-참고-자료)

</div>

---

# 🌟 개요

**Questine**은 레벌업과 같은 RPG 요소가 살짝 가미돼 있는 할 일 관리 서비스입니다. 사용자는 매일 할 일을 기록하고, 할 일 달성 시, 캐릭터가 성장합니다. 재미와 동기부여를 동시에 제공하는 새로운 경험을 목표로 합니다.

# ⚙️ 기술 스택

![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React Query](https://img.shields.io/badge/React%20Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white)

## ERD

<img width="1200" alt="Image" src="https://github.com/user-attachments/assets/0030ad9d-8fad-42b5-b124-19570d79bb5b" />

# 🧩 서비스 주요 기능

<div align="center">

### 할 일 등록/삭제

<table >
  <tr>
    <td max-width="500px">
      <img src="https://github.com/user-attachments/assets/2cfdc55e-00d2-441a-a022-56834104b1df" />
    </td>
    <td>
      할 일 추가 및 삭제를 할 수 있습니다. <br/>
      완료한 할 일 개수에 따라 그라데이션 색상이 적용됩니다. <br/>
      </td>
  </tr>
</table>

**업적**

<table>
  <tr>
    <td max-width="500px">
      <img src="https://github.com/user-attachments/assets/e04c055c-58cb-4633-bb2d-dd7153983673" />
    </td>
    <td>
      다양한 업적을 획득할 수 있습니다. <br/>
    </td>
  </tr>
</table>

**캐릭터**

<table>
  <tr>
    <td max-width="500px">
      <img src="https://github.com/user-attachments/assets/f8e2692d-7b39-40d1-8326-522891509d76" />
    </td>
    <td>
      <b>레벨</b> - 완료한 할 일 개수에 따라 경험치를 올릴 수 있습니다. <br/>
      <b>이미지</b> - 레벨에 따라 다양한 이미지를 제공합니다. <br/>
    </td>
  </tr>
</table>

**랭킹**

<table>
  <tr>
    <td max-width="500px">
      <img src="https://github.com/user-attachments/assets/d2ffe967-b448-4ab7-babd-bed4b6038c1b" />
    </td>
    <td>
      <b>랭킹</b> - 전체 이용자의 랭킹을 확인할 수 있습니다.<br/>
    </td>
  </tr>
</table>
</div>

<br/>

---

# 🔧 트러블슈팅

| **⚠️ 문제** | 할 일 추가 및 삭제 시 인풋 딜레이 발생                                    |
| ----------- | ------------------------------------------------------------------------- |
| 🚧 **원인** | 서버 통신 과정에서 발생하는 네트워크 지연으로 인한 사용자 체감 성능 저하  |
| 💡 **해결** | 낙관적 업데이트를 구현하여 인풋 딜레이 개선 (React-query의 onMutate 활용) |

```jsx
// 할 일 완료/미완료 토글
export function useToggleTodoComplete(year?: number, month?: number) {
  const queryYear = year ?? now.year();
  const queryMonth = month ?? now.month() + 1;
  const queryKey = getTodosQueryKey(queryYear, queryMonth);
  const storageKey = getTodosStorageKey(queryYear, queryMonth);

  return useMutation({

  ...

    onMutate: async ({ todo_id, completed }) => {
    // 할 일 목록과 관련된 요청이 있다면 취소 (서버와의 동기화 충돌 방지 목적)
      await queryClient.cancelQueries({ queryKey });

    // 현재 쿼리 캐시에 저장된 할 일 목록 불러옴 (데이터가 없다면 빈 배열 반환)
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey) ?? [];

	  // 할 일 목록에서 사용자가 토글한 값 업데이트
      const newTodos = previousTodos.map((todo) => (todo.todo_id === todo_id ?
      { ...todo, completed } : todo));

    // 변경된 할 일 목록 업데이트 (낙관적 업데이트)
      queryClient.setQueryData<Todo[]>(queryKey, newTodos);
      await saveTodosStorage(storageKey, newTodos);


    // 에러가 발생할 경우, 이전 할 일 목록 반환 (롤백 -> onError에서 이 반환값 이용)
      return { previousTodos };
    },

	...

  });
}
```

<br /><br />

| **⚠️ 문제** | 할 일 추가 시 타임존 이슈 발생 예) 6월 1일에 등록하면 5월 30일에 추가 됨    |
| ----------- | --------------------------------------------------------------------------- |
| 🚧 **원인** | new Date는 로컬 시간대 기준으로 생성했는데 백엔드에서는 UTC 기준으로 작성함 |
| 💡 **해결** | 클라이언트와 서버의 시간대를 KST로 통일하여 해결 (dayjs 라이브러리 사용)    |

```jsx
// before
const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

// after
const startDate = dayjs(`${year}-${month}-01 00:00:00`).toDate();
const endDate = dayjs(`${year}-${month}-01 00:00:00`).endOf('month').toDate();
```

<br /><br />

| **⚠️ 문제** | 캘린더 라이브러리 커스텀 중, 타입 에러 발생                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| 🚧 **원인** | 라이브러리에서 제공하는 props의 타입이 any로 정의되어있어 어떤 파라미터가 오는지 알 수 없음 (라이브러리 이슈) |
| 💡 **해결** | 따로 커스텀헤더 컴포넌트를 구현하여 import                                                                    |

```

  const customHeader = (props: CalendarHeaderProps) => {
    const year = props.month?.getFullYear();
    const month = props.month?.getMonth() + 1;
    const today = dayjs();
    const isCurrentMonth =
      props.month && props.month.getFullYear() === today.year() && props.month.getMonth() === today.month();

    // 월 변경 시 호출할 공통 함수
    const handleMonthChange = (monthOffset: number) => {
      if (props.month && props.addMonth) {
        const newDate = new Date(props.month);
        newDate.setMonth(newDate.getMonth() + monthOffset);
        props.addMonth(monthOffset);

        // onMonthChange 외부 상태 업데이트 (동기화)
        onMonthChange({
          year: newDate.getFullYear(),
          month: newDate.getMonth() + 1,
          day: 1,
          timestamp: newDate.getTime(),
          dateString: `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-01`,
        });
      }
    };

          <CalendarList
          ...
          customHeader={customHeader}
          ...
          />
```

<br /><br />

| **⚠️ 문제** | refresh token이 유효함에도 불구하고 access token 만료 시간이 지나면 로그아웃되는 현상   |
| ----------- | --------------------------------------------------------------------------------------- |
| 🚧 **원인** | access token 만료 시, 서버에게 재발급 하는 과정을 생략함                                |
| 💡 **해결** | axios interceptor를 이용하여 401 (unauthorized) 일 경우 token을 재발급할 수 있도록 변경 |

```
axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = await getSecureStore('accessToken');
  if (accessToken) {
    if (config.headers) config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      if (error.response?.status === 401) {
        await getAccessToken();
      }
    } catch (error) {}
  }
);
```

---

# 📁 폴더 구조

<div align="left">

`app/` : 라우팅 및 주요 화면 컴포넌트 (file-based routing)

`tabs/` : 메인 탭 화면 (Achievement, Character, Profile, Rank 등)

`auth/` : 인증 관련 화면 (Login, Register 등)

`settings/` : 설정 관련 화면

`components/` : 재사용 가능한 UI 컴포넌트 및 입력 컴포넌트

`constants/` : 상수 및 공통 값 정의 (예: Colors, Calendars)

`hooks/` : 커스텀 훅 (예: useAuth, useTodo)

`api/` : API 통신 및 쿼리 클라이언트

`utils/` : 유틸리티 함수

`assets/` : 이미지, 폰트 등 정적 리소스

`types/` : 타입 정의

</div>

---

# 📄 참고 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [React Native 공식 문서](https://reactnative.dev/)
