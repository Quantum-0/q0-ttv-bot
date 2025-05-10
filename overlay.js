const users = new Set();

const whSecret = "{whSecret}"; // Секрет вебхука
const whId = "{whId}"; // ID вебхука

const pants_raffle_timer = 60 * 1000;

let pants_timestamp = 0;
let pants_user = null;
let pants_raffle_users = null;
let pants_raffle_ts = new Map();
let pants_raffle_owned = new Map();
// TODO: если разыгрывали недавно - запретить, в рандом не попадать, при вызове конкретного - отказать
// Если прошло N минут - разрешить перерозыгрыш
// Если set(users) - set(pants_raffle_owned) = {} - тогда говорим что некого разыгрывать

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
    let value = Math.floor(Math.random() * items.length);
    return items[value];
}

function ChatMessageReceived(data)
{
    let msg_text = data.Message.map((msg) => msg.Content).join(' ');
    let msg_sender = data.User.DisplayName;
    users.add(msg_sender);
    MsgReceived(msg_text, msg_sender);
}

function MsgReceived(msg_text, msg_sender)
{
    // Pants raffle enter
    if (msg_text.startsWith("!трусы")) {
        if (pants_user != null) {
            sendMessage("Невозможно начать новый розыгрыш трусов, пока не разыграли трусы @" + pants_user);
            return;
        }

        // User select
        if (msg_text.startsWith("!трусы @"))
        {
            if (users.has(msg_text.substring(8)))
            {
                pants_user = msg_text.substring(8);
                if (pants_raffle_ts.has(pants_user) && ((Date.now() - pants_raffle_ts.get(pants_user)) < 600)) {
                    sendMessage("Трусы @" + pants_user + " уже были недавно разыграны. Давайте позволим @" + pants_user + " сперва найти и надеть новые трусы, а потом уже разыграем их");
                    return;
                }
            }
            else {
                sendMessage("Не вижу такого пользователя :< Разыгрывать трусы можно только тех людей, кто писал в чатик ^^\"");
                return;
            }
        }
        if (pants_user == null)
            pants_user = getRandomItem(users);

        // Begin raffle
        pants_raffle_users = new Set();
        sendMessage("Внимание, объявляется розыгрыш трусов @" + pants_user + "! Ставьте плюсик в чат для участия в розыгрыше!");
        setTimeout(finishPantsRaffle, pants_raffle_timer);
    }

    // Pants raffle add user
    else if (msg_text == "+" && pants_user != null) {
        pants_raffle_users.add(msg_sender);
        if (pants_raffle_users.size == 5)
            sendMessage("Уже целых 5 человек хотят заполучить трусы @" + pants_user + "! Ничего себе! А ты пользуешься популярностью ;)");
    }
}

function finishPantsRaffle()
{
    // No joined users
    if (pants_raffle_users.size == 0) {
        sendMessage("Розыгрыш окончен! Но, к сожалению, никто не принял участие в розыгрыше твоих трусов, @" + pants_user + ", поэтому они остаются при тебе :с");
        return;
    }

    sendMessage("Розыгрыш трусов окончен! В нашей лотерее приняло участие аж целых " + pants_raffle_users.size + " человек! Время объявлять победителя! Итак.. Трусы @" + pants_user + " сегодня получааааает... *барабанная дробь*");

    // Choose winner
    let pants_winner = getRandomItem(pants_raffle_users);
    let raffle_win_text = "";

    // Send message about winner
    if (pants_winner == pants_user)
        raffle_win_text = "@" + pants_winner + "! Поздравляем, сегодня ты становишься счастливым обладателем собственных трусов! Надевай их скорее обратно! И больше не снимай!";
    else
        raffle_win_text = "@" + pants_winner + "! Поздравляем, сегодня ты становишься счастливым обладателем трусов " + pants_user + "!";
    setTimeout(function() {
        sendMessage(raffle_win_text);
    }, 3000);

    // Update maps
    pants_raffle_ts.set(pants_user, Date.now())

    // Erase data
    pants_user = null;
    pants_raffle_users = null;
}
