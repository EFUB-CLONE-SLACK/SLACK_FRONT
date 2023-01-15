import ChannelList from '@components/ChannelList';
import DMList from '@components/DMList';
import InviteChannelModal from '@components/InviteChannelModal';
import InviteWorkspaceModal from '@components/InviteWorkspaceModal';
import Menu from '@components/Menu';
import Modal from '@components/Modal';
import useInput from '@hooks/useInput';
import useSocket from '@hooks/useSocket';
import {
  AddButton,
  Channels,
  Chats,
  Header,
  LogOutButton,
  MenuScroll,
  ProfileImg,
  ProfileModal,
  RightMenu,
  WorkspaceButton,
  WorkspaceModal,
  WorkspaceName,
  Workspaces,
  WorkspaceWrapper,
} from '@layouts/Workspace/styles';
import loadable from '@loadable/component';
import { Button, Input, Label } from '@pages/SignUp/styles';
import { IChannel, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { VFC, useCallback, useState, useEffect } from 'react';
import { Navigate, Routes, useParams } from 'react-router';
import { Link, Route } from 'react-router-dom';
import useSWR from 'swr';
import gravatar from 'gravatar';
import { toast } from 'react-toastify';
import CreateChannelModal from '@components/CreateChannelModal';
import fetcherWithToken from '@utils/fetcherWithToken';

const Channel = loadable(() => import('@pages/Channel'));
const DirectMessage = loadable(() => import('@pages/DirectMessage'));
//children 없으면 VFC로 받는다.
const Workspace: VFC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showInviteWorkspaceModal, setShowInviteWorkspaceModal] = useState(false);
  const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showWorkspaceData, setWorkspaceData] = useState<any[]>([]);
  const [newWorkspace, onChangeNewWorkspace, setNewWorkpsace] = useInput('');
  const [newUrl, onChangeNewUrl, setNewUrl] = useInput('');
  const { workspace } = useParams<{ workspace: string }>();

  //자식에게 props로 전달할 경우, 자식의 리렌더링을 막기위해 memo 훅을 썼었는데
  //SWR쓰면서 부모만 바뀌거나, 자식만 바뀌거나가 되면서 prop를 잘 안씀
  //데이터 타입이 IUser이거나 false(로그인 안되어있으면)일 수 있다.

  //토큰 관리
  const token = JSON.parse(localStorage.getItem('token') ?? ''); //토큰이 없을 경우
  console.log('Workspace token: ', token);

  //유저정보 전역관리: id, name, emila이 userData에 담김
  const {
    data: userData,
    error,
    mutate,
  } = useSWR<IUser>('http://fake-slack.shop/members/current', (url) => fetcherWithToken(url, token), {
    dedupingInterval: 2000, // 2초마다 데이터 업데이트
  });

  if (userData) {
    console.log(userData, '연결됨');
  }

  //const { data: channelData } = useSWR<IChannel[]>(userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);
  const { data: memberData } = useSWR<IUser[]>(userData ? `/api/workspaces/${workspace}/members` : null, fetcher);
  const [socket, disconnect] = useSocket(workspace);

  useEffect(() => {
    onGetWorkspaceData();
  }, []);

  //'login'이란 이벤트 이름으로 서버에 뒷내용을 보내라.

  /*useEffect(() => {
    if (channelData && userData && socket) {
      console.log(socket);
      socket.emit('login', { id: userData.id, channels: channelData.map((v) => v.id) });
    }
  }, [socket, channelData, userData]);
  
*/
  /*useEffect(() => {
    return () => {
      disconnect();
    };
  }, [workspace, disconnect]);
*/

  const onGetWorkspaceData = useCallback(() => {
    axios.get('http://fake-slack.shop/workspaces').then((res) => {
      console.log(res.data);
      setWorkspaceData(res?.data);
    });
  }, []);

  //로그아웃
  const onLogout = useCallback(() => {
    axios
      .post('http://fake-slack.shop/logout', null, {
        withCredentials: true,
      })
      .then(() => {
        mutate(); //mutate(false,false)였는데 에러남
      });
  }, []);

  const onCloseUserProfile = useCallback((e) => {
    e.stopPropagation();
    setShowUserMenu(false);
  }, []);

  const onClickUserProfile = useCallback(() => {
    setShowUserMenu((prev) => !prev);
    console.log(userData);
  }, []);

  const onClickCreateWorkspace = useCallback(() => {
    setShowCreateWorkspaceModal(true);
  }, []);

  const onCreateWorkspace = useCallback(
    (e) => {
      e.preventDefault();
      if (!newWorkspace || !newWorkspace.trim()) return; //문자열 좌우 공백 제거
      if (!newUrl || !newUrl.trim()) return;
      axios
        .post(
          'http://fake-slack.shop/workspaces',
          {
            name: newWorkspace,
            profileIdList: newUrl.split(','),
          },
          {
            withCredentials: true,
          },
        )
        .then(() => {
          mutate();
          setShowCreateWorkspaceModal(false);
          setNewWorkpsace('');
          setNewUrl('');
        })
        .catch((error) => {
          console.dir(error);
          toast.error(error.response?.data, { position: 'bottom-center' });
        });
    },
    [newWorkspace, newUrl],
  );

  const onCloseModal = useCallback(() => {
    setShowCreateWorkspaceModal(false);
    setShowCreateChannelModal(false);
    setShowInviteWorkspaceModal(false);
    setShowInviteChannelModal(false);
  }, []);

  const toggleWorkspaceModal = useCallback(() => {
    setShowWorkspaceModal((prev) => !prev);
  }, []);

  const onClickAddChannel = useCallback(() => {
    setShowCreateChannelModal(true);
  }, []);

  const onClickInviteWorkspace = useCallback(() => {
    setShowInviteWorkspaceModal(true);
  }, []);

  /*if (!userData) {
    return <Navigate to="/login" />;
  }*/

  //데이터 타입 뒤에 !를 붙이면 false나 undefined가 아님을 알림
  //.?는 optional chaining으로 에러가 발생하는 대신 undefined를 리턴
  return (
    <div>
      <Header>
        <RightMenu>
          <span onClick={onClickUserProfile}>
            <ProfileImg src={gravatar.url(userData?.email!, { s: '28px', d: 'retro' })} alt={userData?.name!} />
            {showUserMenu && (
              <Menu style={{ right: 0, top: 38 }} show={showUserMenu} onCloseModal={onCloseUserProfile}>
                <ProfileModal>
                  <img src={gravatar.url(userData?.email!, { s: '36px', d: 'retro' })} alt={userData?.name!} />
                  <div>
                    <span id="profile-name">{userData?.id!}</span>
                    <span id="profile-active">Active</span>
                  </div>
                </ProfileModal>
                <LogOutButton onClick={onLogout}>로그아웃</LogOutButton>
              </Menu>
            )}
          </span>
        </RightMenu>
      </Header>
      <WorkspaceWrapper>
        <Workspaces>
          {/* 다른 워크스페이스 클릭시 주소 생성*/}
          {showWorkspaceData?.map((wsd) => {
            return (
              <Link key={wsd.id} to={`/workspace/${123}/channel/normal`}>
                <WorkspaceButton>{wsd.name?.slice(0, 1).toUpperCase()}</WorkspaceButton>
              </Link>
            );
          })}
          <AddButton onClick={onClickCreateWorkspace}>+</AddButton>
        </Workspaces>
        <Channels>
          <WorkspaceName onClick={toggleWorkspaceModal}>Sleact</WorkspaceName>
          <MenuScroll>
            <Menu show={showWorkspaceModal} onCloseModal={toggleWorkspaceModal} style={{ top: 95, left: 80 }}>
              <WorkspaceModal>
                <h2>Sleact</h2>

                <button onClick={onClickInviteWorkspace}>워크스페이스에 사용자 초대</button>
                <button onClick={onClickAddChannel}>채널 만들기</button>
                <button onClick={onLogout}>로그아웃</button>
              </WorkspaceModal>
            </Menu>
            <ChannelList />
            <DMList />
          </MenuScroll>
        </Channels>
        <Chats>
          <Routes>
            <Route path="/channel/:channel" element={<Channel />} />
            <Route path="/dm/:id" element={<DirectMessage />} />
          </Routes>
        </Chats>
      </WorkspaceWrapper>
      <Modal show={showCreateWorkspaceModal} onCloseModal={onCloseModal}>
        <form onSubmit={onCreateWorkspace}>
          <Label id="workspace-label">
            <span>워크스페이스 이름</span>
            <Input id="workspace" value={newWorkspace} onChange={onChangeNewWorkspace} />
          </Label>
          <Label id="workspace-url-label">
            <span>이메일로 팀원 추가</span>
            <Input
              id="workspace"
              value={newUrl}
              onChange={onChangeNewUrl}
              placeholder="예:slack@gmail.com, clone@gmail.com"
            />
          </Label>
          <Button type="submit">생성하기</Button>
        </form>
      </Modal>
      <CreateChannelModal
        show={showCreateChannelModal}
        onCloseModal={onCloseModal}
        setShowCreateChannelModal={setShowCreateChannelModal}
      />
      <InviteWorkspaceModal
        show={showInviteWorkspaceModal}
        onCloseModal={onCloseModal}
        setShowInviteWorkspaceModal={setShowInviteWorkspaceModal}
      />
      <InviteChannelModal
        show={showInviteChannelModal}
        onCloseModal={onCloseModal}
        setShowInviteChannelModal={setShowInviteChannelModal}
      />
    </div>
  );
};

export default Workspace;
