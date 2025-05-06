const users = new Set();

const whSecret = "{whSecret}"; // Секрет вебхука
const whId = "{whId}"; // ID вебхука

let pants_timestamp = 0;
let pants_user = null;
let pants_raffle_users = null;

function sendMessage(text) {
  if (whSecret == "" || whId == "") return;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://api.mixitupapp.com/api/webhook/" + whId + "?secret=" + whSecret, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({
      text: text
  }));
}

function getRandomItem(set) {
    let items = Array.from(set);
    console.log("Random from " + items);
    let value = Math.floor(Math.random() * items.length);
    console.log("Index = " + value);
    return items[value];
}

function ChatMessageReceived(data)
{
    let msg_text = data.Message[0].Content;
    let msg_sender = data.User.DisplayName;
    users.add(msg_sender);
    MsgReceived(msg_text, msg_sender);
}

function MsgReceived(msg_text, msg_sender)
{
    if (msg_text == "!трусы") {
        if (pants_user == null)
        {
            pants_user = getRandomItem(users);
            pants_raffle_users = new Set();
            sendMessage("Внимание, объявляется розыгрыш трусов @" + pants_user + "! Ставьте плюсик в чат для участия в розыгрыше!");
            setTimeout(finishPantsRaffle, 60000)
        }
        else
        {
            sendMessage("Невозможно начать новый розыгрыш трусов, пока не разыграли трусы @" + pants_user);
        }
    }
    else if (msg_text == "+" && pants_user != null) {
        pants_raffle_users.add(msg_sender);
        if (pants_raffle_users.size == 5)
            sendMessage("Уже целых 5 человек хотят заполучить трусы @" + pants_user + "! Ничего себе! А ты пользуешься популярностью ;)");
    }
}

function finishPantsRaffle()
{
    if (pants_raffle_users.size == 0)
        sendMessage("Розыгрыш окончен! Но, к сожалению, никто не принял участие в розыгрыше твоих трусов, @" + pants_user + ", поэтому они остаются при тебе :с");
    else {
        sendMessage("Розыгрыш трусов окончен! В нашей лотерее приняло участие аж целых " + pants_raffle_users.size + " человек! Время объявлять победителя! Итак.. Трусы @" + pants_user + " сегодня получааааает... *барабанная дробь*");
        let pants_winner = getRandomItem(pants_raffle_users);
        let raffle_win_text = "";
        if (pants_winner == pants_user)
            raffle_win_text = "@" + pants_winner + "! Поздравляем, сегодня ты становишься счастливым обладателем собственных трусов! Надевай их скорее обратно! И больше не снимай!";
        else
            raffle_win_text = "@" + pants_winner + "! Поздравляем, сегодня ты становишься счастливым обладателем трусов " + pants_user + "!";
        setTimeout(function() {
            sendMessage(raffle_win_text);
        }, 3000);
    }

    pants_user = null;
    pants_raffle_users = null;
}
