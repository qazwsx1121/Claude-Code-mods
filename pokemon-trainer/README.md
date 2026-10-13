# pokemon-trainer

Claude Code를 포켓몬 배틀 화면처럼 꾸미는 모드입니다.

- **시작 화면**: Claude Code를 켜면 4초 동안 포켓몬 로고 도트와 `포켓몬 트레이너 CLAUDE와 모험을 시작하자!`가 나옴 (입력하면 바로 넘어감)
- **입력창 위 배틀 메뉴**: 피카츄 픽셀아트, `▶ 트레이너는 무엇을 할까?` 대화창, `싸운다 / 가방 / 포켓몬 / 도망간다` 메뉴, 남은 컨텍스트(토큰)를 보여 주는 HP 바 (초록 → 노랑 → 빨강)
- **대화 메시지**: 내 요청은 노란 테두리의 `◓ 트레이너` 대화상자로, Claude 응답은 파란 테두리의 `◓ CLAUDE` 대화상자로 표시
- **작업 중 스피너**: 도구마다 기술 이름으로 표시 (Bash → 10만볼트, Read → 사이코키네시스, 웹 검색 → 파도타기, 서브에이전트 → 그림자분신 …)
- **리포트 저장 효과음**: 답변이 끝나면 짧은 칩튠 효과음 재생 (`sounds/report.wav`를 다른 wav로 바꿔도 됨, Windows·macOS)
- **턴 종료 줄**: `◓ 배틀 종료! CLAUDE는 경험치를 얻었다 (3s)`
- **피카츄 색 테마**: 입력창 테두리는 피카츄 노랑, Claude 강조색은 몬스터볼 빨강, 내 메시지 배경은 남색

## 글꼴

터미널 글꼴은 모드가 바꿀 수 없어서 터미널 설정에서 바꿔야 해요. 닌텐도 DS 게임 글씨와 닮은 무료 한글 픽셀 폰트 [갈무리(Galmuri)](https://github.com/quiple/galmuri)의 `Galmuri11`을 추천해요.

## 사용법

```sh
claude --plugin-dir ./pokemon-trainer
```

- `/pokemon`: 배틀 화면 켜기/끄기
- `/pokemon sound`: 효과음 켜기/끄기
- `/theme` → **Pokémon (Pikachu)**: 입력창 테두리와 메시지 배경색까지 바꾸는 테마 (터미널 전용)
  - 목록에 안 보이면 `themes/pokemon.json`을 `~/.claude/themes/`에 복사하세요.

## 테스트

```sh
claude plugin validate ./pokemon-trainer
claude plugin test ./pokemon-trainer
```
