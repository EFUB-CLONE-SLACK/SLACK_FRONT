import EachDM from '@components/EachDM';
import useSocket from '@hooks/useSocket';
import { CollapseButton } from '@components/DMList/styles';
import { IDM, IMember, IUser, IUserWithOnline } from '@typings/db';
import fetcher from '@utils/fetcher';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';

const DMList = () => {
  const { workspace } = useParams<{ workspace?: string }>();
  const { data: userData } = useSWR<IUser>('/api/users', fetcher, {
    dedupingInterval: 2000, // 2초
  });
  const { data: memberData } = useSWR<IUserWithOnline[]>(
    userData ? `/api/workspaces/${workspace}/members` : null,
    fetcher,
  );
  const [socket] = useSocket(workspace);
  const [channelCollapse, setChannelCollapse] = useState(false);
  const [onlineList, setOnlineList] = useState<number[]>([]);
  const [memberList, setMemberList] = useState<IMember[]>([]);
  const toggleChannelCollapse = useCallback(() => {
    setChannelCollapse((prev) => !prev);
  }, []);

  useEffect(() => {
    console.log('DMList: workspace 바꼈다', workspace);
    setOnlineList([]);
    onGetMemberData();
  }, [workspace]);

  //옵셔널 체이닝 연산자(?.) 객체의 값이 없을 때 에러를 발생시키지 않고 undefined를 반환
  useEffect(() => {
    socket?.on('onlineList', (data: number[]) => {
      setOnlineList(data);
    });
    console.log('socket on dm', socket?.hasListeners('dm'), socket);
    return () => {
      console.log('socket off dm', socket?.hasListeners('dm'));
      socket?.off('onlineList');
    };
  }, [socket]);

  const onGetMemberData = useCallback(() => {
    axios.get('http://fake-slack.shop/profiles').then((res) => {
      setMemberList(res?.data);
    });
  }, []);

  return (
    <>
      <h2>
        <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
          {!channelCollapse ? <p>{`>`}</p> : <p>Ⅴ</p>}
        </CollapseButton>
        <span>Direct Messages</span>
      </h2>
      <div>
        {!channelCollapse &&
          memberList?.map((member) => {
            return <EachDM key={member.id} member={member} isOnline={false} />;
          })}
      </div>
    </>
  );
};

export default DMList;
