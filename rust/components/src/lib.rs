//! Pure Rust adapters for the core node component identities and shared node data.

use std::marker::PhantomData;

pub trait Component {
    const KIND: &'static str;
}

#[derive(Clone, Debug, PartialEq)]
pub struct NodeTransform {
    pub position: [f64; 3],
    pub rotation: [f64; 4],
    pub scale: [f64; 3],
}

impl Default for NodeTransform {
    fn default() -> Self {
        Self {
            position: [0.0; 3],
            rotation: [0.0, 0.0, 0.0, 1.0],
            scale: [1.0; 3],
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct NodeWrapper<C: Component> {
    pub id: String,
    pub active: bool,
    pub transform: NodeTransform,
    component: PhantomData<C>,
}

impl<C: Component> NodeWrapper<C> {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            active: true,
            transform: NodeTransform::default(),
            component: PhantomData,
        }
    }

    pub fn kind(&self) -> &'static str {
        C::KIND
    }
}

macro_rules! define_components {
    ($($marker:ident => $wrapper:ident => $kind:literal),+ $(,)?) => {
        $(
            #[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
            pub struct $marker;

            impl Component for $marker {
                const KIND: &'static str = $kind;
            }

            pub type $wrapper = NodeWrapper<$marker>;
        )+

        pub const COMPONENT_KINDS: &[&str] = &[$(<$marker as Component>::KIND),+];
    };
}

define_components! {
    Group => GroupNode => "group",
    Mesh => MeshNode => "mesh",
    SkinnedMesh => SkinnedMeshNode => "skinnedmesh",
    Lod => LodNode => "lod",
    Audio => AudioNode => "audio",
    Video => VideoNode => "video",
    Image => ImageNode => "image",
    Snap => SnapNode => "snap",
    Prim => PrimNode => "prim",
    Avatar => AvatarNode => "avatar",
    Action => ActionNode => "action",
    Anchor => AnchorNode => "anchor",
    Nametag => NametagNode => "nametag",
    Particles => ParticlesNode => "particles",
    Sky => SkyNode => "sky",
    Ui => UiNode => "ui",
    UiView => UiViewNode => "uiview",
    UiText => UiTextNode => "uitext",
    UiImage => UiImageNode => "uiimage",
    Controller => ControllerNode => "controller",
    RigidBody => RigidBodyNode => "rigidbody",
    Collider => ColliderNode => "collider",
    Joint => JointNode => "joint",
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wrapper_uses_core_node_defaults_and_component_kind() {
        let node = MeshNode::new("mesh-1");

        assert_eq!(node.id, "mesh-1");
        assert!(node.active);
        assert_eq!(node.kind(), "mesh");
        assert_eq!(node.transform, NodeTransform::default());
    }

    #[test]
    fn registry_matches_all_core_node_component_kinds() {
        assert_eq!(
            COMPONENT_KINDS,
            &[
                "group",
                "mesh",
                "skinnedmesh",
                "lod",
                "audio",
                "video",
                "image",
                "snap",
                "prim",
                "avatar",
                "action",
                "anchor",
                "nametag",
                "particles",
                "sky",
                "ui",
                "uiview",
                "uitext",
                "uiimage",
                "controller",
                "rigidbody",
                "collider",
                "joint",
            ]
        );
    }
}
