import Modal from '@components/Modal';
import useInput from '@hooks/useInput';
import { Button, Input, Label } from '@pages/SignUp/styles';
import { IChannel, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { useCallback, VFC } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import useSWR from 'swr';

interface Props {
  show: boolean;
  onCloseModal: () => void; //리턴 타입이 void 타입
  setShowCreateChannelModal: (flag: boolean) => void; //매개변수 타입이 boolean이고 리턴 타입이 void
}

const CreateChannelModal: VFC<Props> = ({ show, onCloseModal, setShowCreateChannelModal }) => {
  const [newChannel, onChangeNewChannel, setNewChannel] = useInput('');
  const [channelEmail, onChangeChannelEmail, setChannelEmail] = useInput('');
  //객체 데이터 타입<{}>
  const { workspace, channel } = useParams<{ workspace: string; channel: string }>();
  const { data: userData, error } = useSWR<IUser | false>('/api/users', fetcher, {
    dedupingInterval: 2000, // 2초
  });
  //배열 데이터 타입<Type[]>
  const { data: channelData, mutate: revalidateChannel } = useSWR<IChannel[]>(
    userData ? `http://localhost:3095/api/workspaces/${workspace}/channels` : null,
    fetcher,
  ); //삼항 연산자

  const onCreateChannel = useCallback(
    (e) => {
      e.preventDefault();
      axios
        .post(
          `http://fake-slack.shop/workspaces/${workspace}/chatroom`,
          {
            name: newChannel,
            type: 'DM',
            teammate: channelEmail.replace(' ', '').split(','),
          },
          {
            withCredentials: true,
          },
        )
        .then((response) => {
          setShowCreateChannelModal(false);
          revalidateChannel();
          setNewChannel('');
          setChannelEmail('');
        })
        .catch((error) => {
          console.dir(error);
          toast.error(error.response?.data, { position: 'bottom-center' });
        });
    },
    [newChannel],
  );

  return (
    <Modal show={show} onCloseModal={onCloseModal}>
      <form onSubmit={onCreateChannel}>
        <Label id="channel-label">
          <span>채널</span>
          <Input id="channel" value={newChannel} onChange={onChangeNewChannel} />
        </Label>
        <Label id="channel-label">
          <span>이메일로 추가하기</span>
          <Input
            id="channel"
            value={channelEmail}
            onChange={onChangeChannelEmail}
            placeholder="예:slack@gmail.com, clone@gmail.com"
          />
        </Label>
        <Button type="submit">생성하기</Button>
      </form>
    </Modal>
  );
};

export default CreateChannelModal;
